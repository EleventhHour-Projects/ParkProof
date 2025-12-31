package api

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

type QueryRrquest struct {
	Query            string    `json:"query"`
	ToParkingLot     string    `json:"to_parking_lot"`
	ResponseRequired bool      `json:"response_required"`
	Time             time.Time `json:"time"`
	WithInTime       int       `json:"with_in_time"`
}

func SendQuery(c *fiber.Ctx) error {
	var data QueryRrquest
	c.BodyParser(&data)

	//err := database.NewQuery(data)
	c.Status(200)
	return c.JSON(map[string]string{"status": "done"})
}
