package api

import (
	"app/internal"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

type QRCodeRequest struct {
	TicketID    string                   `json:"ticket_id"`
	Vehicle     string                   `json:"vehicle"`
	ParkingLot  string                   `json:"parking_lot"`
	VehicleType internal.VehicleTypeEnum `json:"vehicle_type"`
}

type UserQRRequest struct {
	Vehicle     string                   `json:"vehicle"`
	VehicleType internal.VehicleTypeEnum `json:"vehicle_type"`
	Username    string                   `json:"username"`
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
	fmt.Println(data)

	png, err := internal.QRCode(data)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	c.Set("Content-Type", "image/png")
	c.Set("Content-Disposition", "inline; filename=parking_qr.png")
	fmt.Println("Send QR")
	return c.Send(png)
}

func GetUserProfileQR(c *fiber.Ctx) error {
	var d UserQRRequest
	c.BodyParser(&d)
	data := internal.UserQRCodeData{
		Type:        "user",
		Vehicle:     d.Vehicle,
		VehicleType: d.VehicleType,
		Username:    d.Username,
	}
	fmt.Println(data)

	png, err := internal.QRCodeUser(data)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	c.Set("Content-Type", "image/png")
	c.Set("Content-Disposition", "inline; filename=parking_qr.png")
	fmt.Println("Send QR")
	return c.Send(png)
}
