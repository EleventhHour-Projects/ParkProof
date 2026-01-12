package api

import (
	"app/internal/database"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

// AddTamperLog - Adds a new tamper-proof log
func AddTamperLog(c *fiber.Ctx) error {
	var req database.TamperLog

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Validate required fields
	if req.VehicleNo == "" || req.ParkingLotID == "" || req.Action == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing required fields"})
	}

	// Get the last log to find the previous hash
	lastLog, err := database.GetLastTamperLog()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch last log"})
	}

	prevHash := "0" // Genesis hash
	if lastLog != nil {
		prevHash = lastLog.Hash
	}

	// Set timestamps and prev hash
	req.EntryExitTime = time.Now()
	req.CreatedAt = time.Now()
	req.PrevHash = prevHash

	// Calculate Hash: SHA256(VehicleNo + VehicleType + ParkingLotID + EntryExitTime + PrevHash)
	dataString := fmt.Sprintf("%s%s%s%s%s", req.VehicleNo, req.VehicleType, req.ParkingLotID, req.EntryExitTime.String(), req.PrevHash)
	hash := sha256.Sum256([]byte(dataString))
	req.Hash = hex.EncodeToString(hash[:])

	// Insert into DB
	if err := database.InsertTamperLog(req); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save log"})
	}

	return c.JSON(fiber.Map{"message": "Log added successfully", "log": req})
}

// GetTamperLogs - Retrieves all logs
func GetTamperLogs(c *fiber.Ctx) error {
	logs, err := database.GetAllTamperLogs()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch logs"})
	}
	return c.JSON(logs)
}
