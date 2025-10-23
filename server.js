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

  type MovieCredits {
    cast: [CastMember]
    crew: [CrewMember]
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
  }

  type Genre {
    id: Int
    name: String
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

  type MovieImage {
    aspect_ratio: Float
    file_path: String
    height: Int
    iso_639_1: String
    vote_average: Float
    vote_count: Int
    width: Int
  }

  type MovieImages {
    backdrops: [MovieImage]
    logos: [MovieImage]
    posters: [MovieImage]
  }


  type MovieDetails {
    id: ID!
    title: String
    overview: String
    release_date: String
    runtime: Int
    status: String
    tagline: String
    budget: Int
    revenue: Int
    poster_path: String
    backdrop_path: String
    vote_average: Float
    genres: [Genre]
    production_companies: [ProductionCompany]
    production_countries: [ProductionCountry]
    spoken_languages: [SpokenLanguage]
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
    movieCredits(id: ID!): MovieCredits
    movieDetails(id: ID!): MovieDetails
    movieImages(id: ID!): MovieImages
    movieSimilar(id: ID!): [Movie]
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
        `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=es-ES`
      );
      return res.json();
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
    movieDetails: async (_, { id }) => {
      const res = await fetch(
        `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=es-ES`
      );
      return res.json();
    },
    // movieImages: async (_, { id }) => {
    //   const res = await fetch(
    //     `${BASE_URL}/movie/${id}/images?api_key=${API_KEY}`
    //   );
    //   const data = await res.json();
    //   return data; // contiene { backdrops, logos, posters }
    // },
    movieImages: async (_, { id }) => {
      const res = await fetch(
        `${BASE_URL}/movie/${id}/images?api_key=${API_KEY}`
      );
      const data = await res.json();

      // Filtramos logos en español
      const logosES = data.logos.filter((logo) => logo.iso_639_1 === "es");

      // Si no hay en español, puedes devolver en inglés como fallback
      return {
        ...data,
        logos: logosES.length > 0 ? logosES : data.logos,
      };
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
