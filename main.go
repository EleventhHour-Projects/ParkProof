package main

import (
	"app/internal"
	"time"

	"github.com/google/uuid"
)

func main() {
	data := internal.VehicleQRCodeData{
		Vehicle:     "DL1E5483",
		TicketID:    uuid.New().String(),
		EntryTime:   time.Now(),
		IsExit:      false,
		ParkingLot:  "PLID5387",
		VehicleType: internal.VehicleTypeCar,
	}
	internal.QRCode(data)
}
