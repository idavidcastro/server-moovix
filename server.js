import "dotenv/config"; // 👈 Loads environment variables from .env for local development

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

// Use environment variables for security and flexibility
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 4000;

const BASE_URL = "https://api.themoviedb.org/3";

// 💡 Security Check: Ensure the API key is loaded
if (!API_KEY) {
  throw new Error(
    "API_KEY environment variable is not set. Check your .env file or deployment settings."
  );
}

const typeDefs = `#graphql
  type MovieVideo {
    key: String
    name: String
    site: String
    type: String
  }

  type Movie {
    id: ID!
    title: String
    overview: String
    release_date: String
    poster_path: String
    vote_average: Float
    backdrop_path: String
    adult: String
    genre_ids: [Int]
    original_language: String
    popularity: Float
    vote_count: Int
    original_title: String
    logo_path: String
  }

  type Genre {
    id: Int
    name: String
  }

  type Query {
    movieGenres: [Genre]
    popularMovies: [Movie]
    nowPlayingMovies: [Movie]
    topRatedMovies: [Movie]
    upcomingMovies: [Movie]
    searchMovies(query: String!): [Movie]
    movieById(id: ID!): Movie
    getMovieVideos(movieId: ID!): [MovieVideo]
  }
`;

const resolvers = {
  Query: {
    popularMovies: async () => {
      const res = await fetch(
        // API_KEY is used here via the variable
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      return data.results;
    },
    nowPlayingMovies: async () => {
      const res = await fetch(
        `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      return data.results;
    },
    topRatedMovies: async () => {
      const res = await fetch(
        `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      return data.results;
    },
    upcomingMovies: async () => {
      const res = await fetch(
        `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      return data.results;
    },
    searchMovies: async (_, { query }) => {
      const res = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&language=es-ES&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      return data.results;
    },
    movieById: async (_, { id }) => {
      const [movieRes, imagesRes] = await Promise.all([
        fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=es-ES`),
        fetch(`${BASE_URL}/movie/${id}/images?api_key=${API_KEY}`),
      ]);

      const [movieData, imagesData] = await Promise.all([
        movieRes.json(),
        imagesRes.json(),
      ]);

      // Función para seleccionar el mejor logo
      const getBestLogo = (logos) => {
        if (!logos || logos.length === 0) return null;

        // Primero intentamos encontrar un logo en español
        let logo = logos.find((l) => l.iso_639_1 === "es");

        // Si no hay en español, buscamos en inglés
        if (!logo) {
          logo = logos.find((l) => l.iso_639_1 === "en");
        }

        // Si no hay en español ni inglés, tomamos el que tenga mejor puntuación
        if (!logo) {
          logo = logos.sort((a, b) => b.vote_average - a.vote_average)[0];
        }

        return logo;
      };

      const bestLogo = getBestLogo(imagesData.logos);

      return {
        ...movieData,
        logo_path: bestLogo ? bestLogo.file_path : null,
      };
    },
    movieGenres: async () => {
      const res = await fetch(
        `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      return data.genres;
    },
    getMovieVideos: async (_, { movieId }) => {
      const res = await fetch(
        `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`
      );
      const data = await res.json();
      return data.results;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT },
  cors: {
    origin: [
      // 1. Origen Local (para desarrollo)
      "http://localhost:5173",
      // 2. Origen de Render (si tienes un frontend desplegado)
      "https://su-frontend.onrender.com",
      // Puedes añadir más orígenes aquí si los necesitas
    ],
    credentials: true,
  },
});

console.log(`🚀 Servidor GraphQL corriendo en: ${url}`);
