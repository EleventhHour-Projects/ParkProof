package api

import (
	"app/internal/database"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		c.Status(400)
		return c.JSON(fiber.Map{"error": "Image upload failed"})
	}

	// Open file
	f, err := file.Open()
	if err != nil {
		c.Status(500)
		return c.JSON(fiber.Map{"error": "Failed to open image"})
	}
	defer f.Close()

	// Read file content
	data, err := io.ReadAll(f)
	if err != nil {
		c.Status(500)
		return c.JSON(fiber.Map{"error": "Failed to read image content"})
	}

	// Generate ID
	ext := filepath.Ext(file.Filename)
	id := fmt.Sprintf("%s%d%s", uuid.New().String(), time.Now().Unix(), ext)

	// Save to DB
	img := database.Image{
		ID:          id,
		Data:        data,
		ContentType: file.Header.Get("Content-Type"),
	}

	if err := database.SaveImage(img); err != nil {
		c.Status(500)
		return c.JSON(fiber.Map{"error": "Failed to save image to database"})
	}

	// Return public URL (DB served)
	publicURL := fmt.Sprintf("/uploads/%s", id)
	return c.JSON(fiber.Map{"url": publicURL})
}

func ServeImage(c *fiber.Ctx) error {
	filename := c.Params("filename")
	img, err := database.GetImage(filename)
	if err != nil {
		c.Status(404)
		return c.SendString("Image not found")
	}

	c.Set("Content-Type", img.ContentType)
	return c.Send(img.Data)
}
