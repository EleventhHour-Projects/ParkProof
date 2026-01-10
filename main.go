package main

import (
	"app/internal"
	"app/internal/database"
	"app/routes"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func loadEnv() {
	envPath := "nextjs-app/.env"

	if _, err := os.Stat(envPath); err == nil {
		if err := godotenv.Load(envPath); err != nil {
			log.Println("Warning: Could not load .env file:", err)
		} else {
			log.Println("Loaded environment variables from", envPath)
		}
	} else {
		log.Println(".env file not found at", envPath)
	}
}

func main() {
	loadEnv()
	database.MongoDBURI = os.Getenv("MONGODB_URI")
	database.MongoDB()
	go internal.Cleaner()
	routes.Router()
}
