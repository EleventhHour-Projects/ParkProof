package risk

import (
	"log"
	"math/rand"
	"sync"
	"time"

	"app/internal/database"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func StartRiskAnalysisScheduler() {
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for range ticker.C {
			runAnalysis()
		}
	}()
	// Run once immediately for testing/demo purposes
	go runAnalysis()
}

func runAnalysis() {
	log.Println("Starting Risk Analysis...")
	ids, err := database.GetAllParkingLotIDs()
	if err != nil {
		log.Println("Error getting parking lot IDs:", err)
		return
	}

	var wg sync.WaitGroup
	for _, id := range ids {
		wg.Add(1)
		go func(lotID string) {
			defer wg.Done()
			analyzeLot(lotID)
		}(id)
	}
	wg.Wait()
	log.Println("Risk Analysis completed for all lots.")
}

func analyzeLot(id string) {
	score := 0
	var factors []string

	// Rule 1: Citizen Report Density
	r1Score, r1Factors := checkReportDensity(id)
	score += r1Score
	factors = append(factors, r1Factors...)

	// Rule 2: Traffic vs Ticket Mismatch
	r2Score, r2Factors := checkTrafficMismatch(id)
	score += r2Score
	factors = append(factors, r2Factors...)

	// Rule 3: Ticket Duration Distribution Shift
	r3Score, r3Factors := checkDurationShift(id)
	score += r3Score
	factors = append(factors, r3Factors...)

	// Factor in Previous Risk Score (25% decay/momentum)
	prevRisk, err := database.GetRiskScore(id)
	prevScore := 0
	if err == nil {
		prevScore = prevRisk.Score
	}

	historicalFactor := int(float64(prevScore) * 0.25)
	if historicalFactor > 0 {
		score += historicalFactor // Use score variable instead of ruleScore to match existing local var
		factors = append(factors, "Historical risk factor contributing")
	}

	level := "LOW"
	if score >= 50 {
		level = "HIGH"
	} else if score >= 20 {
		level = "MEDIUM"
	}

	// Join factors into a single reason string
	reason := ""
	if len(factors) > 0 {
		// Just take the first one or join them. The screenshot shows a single sentence.
		// Let's join them with ". " if multiple.
		for i, f := range factors {
			if i > 0 {
				reason += ". "
			}
			reason += f
		}
	} else {
		reason = "Normal operations"
	}

	// Save result for all lots to ensure visibility
	log.Printf("Saving risk score for lot %s: %d (Prev: %d) Reason: %s", id, score, prevScore, reason)

	objID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		log.Println("Invalid lot ID:", id)
		return
	}

	rs := database.RiskScore{
		ParkingLotID: objID,
		Score:        score,
		Reason:       reason,
		Level:        level,
		AnalyzedAt:   time.Now(),
	}
	if err := database.SaveRiskScore(rs); err != nil {
		log.Println("Error saving risk score:", err)
	}
}

// Rule 1: Citizen Report Density
func checkReportDensity(id string) (int, []string) {
	reports, err := database.GetReportsLast48Hours(id)
	if err != nil {
		log.Println("Error getting reports for R1:", err)
		return 0, nil
	}

	// Filter unique user reports (simple deduplication by UserID)
	uniqueUsers := make(map[string]bool)
	count := 0
	for _, r := range reports {
		uid := r.UserID.Hex()
		// If UserID is not set (anonymous?), count it? Assuming userId exists for now.
		if r.UserID.IsZero() {
			count++ // Count anonymous differently? For now, count all
		} else {
			if !uniqueUsers[uid] {
				uniqueUsers[uid] = true
				count++
			}
		}
	}

	if count >= 5 {
		return 50, []string{"R1: High density of citizen reports (>=5 unique in 48h)"}
	}
	if count >= 3 {
		return 30, []string{"R1: Medium density of citizen reports (>=3 unique in 48h)"}
	}
	return 0, nil
}

// Rule 2: Traffic vs Ticket Mismatch
// Simulating traffic data since we don't have a real source
func checkTrafficMismatch(id string) (int, []string) {
	// Mock: Randomly decide if there is congestion (20% chance)
	// In real app, call Google Maps API or internal traffic service
	isCongested := rand.Float32() < 0.2

	if !isCongested {
		return 0, nil
	}

	// Case 1: Low Ticket Count (last 1 hour)
	tickets, err := database.GetTicketsLastWindow(id, 1*time.Hour)
	if err != nil {
		log.Println("Error getting tickets for R2:", err)
		return 0, nil
	}

	ticketCount := len(tickets)
	expectedTickets := 5 // Threshold for "Low Ticket Count"

	if ticketCount < expectedTickets {
		// Refine Case 2: Ticketing Stalled (Zero tickets in last 2 hours)
		// We already checked 1 hour. If count is 0, let's check deeper.
		if ticketCount == 0 {
			longWindowTickets, err := database.GetTicketsLastWindow(id, 2*time.Hour)
			if err == nil && len(longWindowTickets) == 0 {
				return 60, []string{"R2: Ticketing Stalled + Persistent Congestion (Potential off-app parking)"}
			}
		}

		return 40, []string{"R2: Traffic congestion with low ticket activity"}
	}

	return 0, nil
}

// Rule 3: Duration Shift
func checkDurationShift(id string) (int, []string) {
	// Current Window: Last 24 hours
	currentTickets, err := database.GetTicketsLastWindow(id, 24*time.Hour)
	if err != nil {
		return 0, nil
	}
	if len(currentTickets) < 10 {
		return 0, nil // Not enough data
	}

	// Baseline Window: Last 30 days
	baselineTickets, err := database.GetTicketsLastWindow(id, 30*24*time.Hour)
	if err != nil {
		return 0, nil
	}

	currentShortRatio := calculateShortStayRatio(currentTickets)
	baselineShortRatio := calculateShortStayRatio(baselineTickets)

	// Threshold: 20% shift
	if abs(currentShortRatio-baselineShortRatio) > 0.2 {
		return 30, []string{"R3: Significant shift in ticket duration distribution"}
	}

	return 0, nil
}

func calculateShortStayRatio(tickets []database.Ticket) float64 {
	if len(tickets) == 0 {
		return 0
	}
	shortCount := 0
	for _, t := range tickets {
		// Assess duration from ValidTill (assuming ValidTill - CreatedAt ~ duration)
		// Or if we have actual duration. Default ticket is 1h10m.
		// If ValidTill is roughly 1-2 hours from CreatedAt, count as short stay.
		duration := t.ValidTill.Sub(t.CreatedAt)
		if duration < 2*time.Hour {
			shortCount++
		}
	}
	return float64(shortCount) / float64(len(tickets))
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
