package api

import (
	"app/internal"

	"github.com/gofiber/fiber/v2"
)

type QRCodeRequest struct {
	TicketID    string                   `json:"ticket_id"`
	Vehicle     string                   `json:"vehicle"`
	ParkingLot  string                   `json:"parking_lot"`
	VehicleType internal.VehicleTypeEnum `json:"vehicle_type"`
}

func GetVehicleQR(c *fiber.Ctx) error {
	var d QRCodeRequest
	c.BodyParser(&d)

	data := internal.VehicleQRCodeData{
		Type:        "ticket",
		TicketID:    d.TicketID,
		Vehicle:     d.Vehicle,
		ParkingLot:  d.ParkingLot,
		VehicleType: d.VehicleType,
	}

	png, err := internal.QRCode(data)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	c.Set("Content-Type", "image/png")
	c.Set("Content-Disposition", "inline; filename=parking_qr.png")

	return c.Send(png)
}
