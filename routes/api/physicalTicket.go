package api

import (
	"app/internal"
	"bytes"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"
)

func hr(pdf *gofpdf.Fpdf) {
	y := pdf.GetY()
	pdf.Line(5, y, 75, y)
	pdf.Ln(3)
}

func GeneratePhysicalTicket(c *fiber.Ctx) error {
	var req internal.VehicleQRCodeData
	if err := c.BodyParser(&req); err != nil {
		return err
	}

	// Generate QR in memory
	qrData := req.Vehicle + "|PLID" + req.ParkingLot
	qrPNG, err := qrcode.Encode(qrData, qrcode.Medium, 256)
	if err != nil {
		return err
	}

	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		OrientationStr: "P",
		UnitStr:        "mm",
		Size:           gofpdf.SizeType{Wd: 80, Ht: 180},
	})
	issuedAt := time.Now().Format("02/01/2006 03:04 PM")

	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(0, 5, "Municipal Corporation of Delhi", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 9)
	pdf.CellFormat(0, 4, "Parking Ticket", "", 1, "C", false, 0, "")

	pdf.Ln(2)
	hr(pdf)

	// Vehicle + Lot
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(0, 4, req.Vehicle, "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 8)
	pdf.CellFormat(0, 4, "PLID "+req.ParkingLot, "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 7)
	pdf.CellFormat(0, 4, "Issued: "+issuedAt, "", 1, "C", false, 0, "")

	pdf.Ln(2)
	hr(pdf)

	// QR
	pdf.RegisterImageOptionsReader(
		"qr",
		gofpdf.ImageOptions{ImageType: "PNG"},
		bytes.NewReader(qrPNG),
	)

	x := float64((80 - 36) / 2)
	pdf.Image("qr", x, pdf.GetY(), 36, 0, false, "", 0, "")

	pdf.Ln(40)
	hr(pdf)

	// Pricing
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(0, 5, "Pricing", "", 1, "C", false, 0, "")

	pdf.Ln(1)
	pdf.SetFont("Arial", "", 8)

	pdf.CellFormat(40, 5, "4 Wheeler", "", 0, "", false, 0, "")
	pdf.CellFormat(0, 5, "₹20/hr   ₹480/day", "", 1, "R", false, 0, "")

	pdf.CellFormat(40, 5, "2 Wheeler", "", 0, "", false, 0, "")
	pdf.CellFormat(0, 5, "₹10/hr   ₹240/day", "", 1, "R", false, 0, "")

	pdf.CellFormat(40, 5, "3 Wheeler", "", 0, "", false, 0, "")
	pdf.CellFormat(0, 5, "₹20/hr   ₹480/day", "", 1, "R", false, 0, "")

	pdf.Ln(3)
	hr(pdf)

	// Footer
	pdf.SetFont("Arial", "", 7)
	pdf.CellFormat(0, 4, "Go digital. Get your parking ticket at", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "B", 7)
	pdf.CellFormat(0, 4, "parkproof.com", "", 1, "C", false, 0, "")

	// Stream PDF to client
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return err
	}

	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", "inline; filename=parking_ticket.pdf")

	return c.SendStream(&buf)
}
