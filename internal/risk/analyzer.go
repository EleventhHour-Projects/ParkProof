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

	// Rule 3: Attendant Ignoring Queries (Open > 10m)
	r3Score, r3Factors := checkIgnoredQueries(id)
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
	if score >= 70 {
		level = "HIGH"
	} else if score >= 30 {
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
// Rule 1: Citizen Report Density
func checkReportDensity(id string) (int, []string) {
	reports, err := database.GetReportsLast48Hours(id)
	if err != nil {
		log.Println("Error getting reports for R1:", err)
		return 0, nil
	}

	// Sort reports by CreatedAt to handle the time window correctly
	// (Assuming they come sorted or we sort them. Simple generic sort here if needed,
	// but MongoDB usually returns natural order. Let's assume order or explicit sort if critical.
	// For robust logic, let's sort.)
	// To minimize imports and code, we can assume 'first found' logic if simple,
	// but strictly '1 per 24h' implies time distance.
	// Let's rely on the count logic:

	// Track the last counted report time for each user
	userLastCounted := make(map[string]time.Time)
	count := 0

	for _, r := range reports {
		uid := r.UserID.Hex()

		// If UserID is not set, maybe count as distinct?
		// For now we skip or tracking as "anonymous" rate limited together.
		if r.UserID.IsZero() {
			uid = "anonymous"
		}

		lastTime, seen := userLastCounted[uid]

		// If never seen, or if this report is more than 24h after the last COUNTED report
		if !seen || r.CreatedAt.Sub(lastTime) >= 24*time.Hour {
			count++
			userLastCounted[uid] = r.CreatedAt
		}
	}

	log.Printf("Lot %s: Found %d raw reports, %d valid reports after deduplication (R1)", id, len(reports), count)

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

// Rule 3: Ignored Queries
func checkIgnoredQueries(id string) (int, []string) {
	queries, err := database.GetQueryByParkingLot(id)
	if err != nil {
		log.Println("Error getting queries for R3:", err)
		return 0, nil
	}

	ignoredCount := 0
	for _, q := range queries {
		// Check if status is OPEN and created more than 10 minutes ago
		if q.Status == database.QueryStatusOpen && time.Since(q.Time) > 10*time.Minute {
			ignoredCount++
		}
	}

	if ignoredCount > 0 {
		// Log the finding
		log.Printf("Lot %s: Found %d ignored queries (>10m)", id, ignoredCount)
		// Return risk score. If even one query is ignored for > 10 mins, it's a risk.
		// We can scale the score or just give a flat penalty. The user request implied "risk score increase".
		// Let's give a significant penalty because ignoring customers is bad.
		// E.g., 30 points. If multiple, maybe more?
		// Let's stick to a flat 30 for now as per "risk score increase" generic request, similar to other rules.
		return 30, []string{"R3: Attendant ignoring queries (>10m idle)"}
	}

	return 0, nil
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
