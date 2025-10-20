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
  type CastMember {
    id: ID
    name: String
    character: String
    profile_path: String
  }

  type CrewMember {
    id: ID
    name: String
    job: String
    department: String
  }

  type MovieVideo {
    key: String
    name: String
    site: String
    type: String
  }

  type ProductionCompany {
    id: Int
    name: String
    logo_path: String
    origin_country: String
  }

  type ProductionCountry {
    iso_3166_1: String
    name: String
  }

  type SpokenLanguage {
    iso_639_1: String
    name: String
  }

  type MovieDetails {
    id: ID!
    title: String
    overview: String
    release_date: String
    runtime: Int
    budget: Int
    revenue: Int
    status: String
    tagline: String
    poster_path: String
    backdrop_path: String
    genres: [Genre]
    vote_average: Float
    vote_count: Int
    popularity: Float
    homepage: String
    production_companies: [ProductionCompany]
    production_countries: [ProductionCountry]
    spoken_languages: [SpokenLanguage]
    credits: MovieCredits
    videos: MovieVideos
  }

  type MovieCredits {
    cast: [CastMember]
    crew: [CrewMember]
  }

  type MovieVideos {
    results: [MovieVideo]
  }

  type Genre {
    id: Int
    name: String
  }

  type Query {
    movieById(id: ID!): MovieDetails
    movieGenres: [Genre]
    popularMovies: [Movie]
    nowPlayingMovies: [Movie]
    topRatedMovies: [Movie]
    upcomingMovies: [Movie]
    searchMovies(query: String!): [Movie]
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
      const res = await fetch(
        `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=es-ES&append_to_response=credits,videos`
      );
      const data = await res.json();
      return data;
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
    movieCredits: async (_, { id }) => {
      const res = await fetch(
        `${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      return data; // ya tiene "cast" y "crew"
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
      // "https://su-frontend.onrender.com",
      // Puedes añadir más orígenes aquí si los necesitas
    ],
    credentials: true,
  },
});

console.log(`🚀 Servidor GraphQL corriendo en: ${url}`);
