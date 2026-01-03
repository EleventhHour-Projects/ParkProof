package routes

import (
	"app/routes/api"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/monitor"
)

func Router() {
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Content-Type, Authorization",
	}))
	app.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path}\n",
	}))

	app.Get("/metrics", monitor.New(monitor.Config{Title: "ParkProof Go Backend Monitor"}))
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// Query Routes
	app.Post("/api/admin/query", api.SendQuery) // New Query by Admin

	// QR Code Routes
	app.Post("/internal/vehicleqr", api.GetVehicleQR) // Give QR Code for Vehicle

	log.Fatal(app.Listen(":8000"))
}
