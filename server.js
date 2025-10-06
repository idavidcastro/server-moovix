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
    video: Boolean
    vote_count: Int
    original_title: String
  }

  type Query {
    popularMovies: [Movie]
    searchMovies(query: String!): [Movie]
    movieById(id: ID!): Movie
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
