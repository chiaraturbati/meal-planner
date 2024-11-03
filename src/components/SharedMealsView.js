// src/components/SharedMealsView.js
import React from "react";
import {
  getCategoryStyle,
  cardStyle,
  typographyStyles,
  layoutStyles,
} from "../utils/styles";

const SharedMealsView = ({ sharedMeals }) => {
  const mealBoxStyle = (category) => ({
    padding: "15px",
    borderRadius: "12px",
    ...getCategoryStyle(category),
    transition: "transform 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
    },
  });

  const categoryBadgeStyle = {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    fontSize: "0.85em",
    marginTop: "8px",
    backdropFilter: "blur(4px)",
  };

  const ownerTagStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: "20px",
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    fontSize: "0.9em",
    fontWeight: "500",
    marginBottom: "8px",
  };

  const dateStyle = {
    color: "#666",
    fontSize: "0.95em",
    fontWeight: "500",
    marginLeft: "8px",
  };

  const noMealsStyle = {
    ...cardStyle,
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "#f8f9fa",
    border: "2px dashed #ddd",
  };

  const mealHeaderStyle = {
    fontSize: "1em",
    fontWeight: "600",
    marginBottom: "8px",
    color: "inherit",
  };

  const mealContentStyle = {
    fontSize: "0.95em",
    marginBottom: "8px",
    lineHeight: "1.4",
  };

  return (
    <div
      style={{
        marginTop: "40px",
        padding: "25px",
        borderRadius: "16px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h2 style={typographyStyles.h2}>Piani Pasti Condivisi con Me</h2>

      {sharedMeals.length === 0 ? (
        <div style={noMealsStyle}>
          <h3
            style={{ color: "#555", marginBottom: "10px", fontSize: "1.2em" }}
          >
            Nessun piano pasti condiviso
          </h3>
          <p style={{ color: "#888" }}>
            I piani pasti condivisi con te appariranno qui
          </p>
        </div>
      ) : (
        <div style={layoutStyles.grid}>
          {sharedMeals.map((meal) => (
            <div
              key={meal.id}
              style={{
                ...cardStyle,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                },
              }}
            >
              <div style={layoutStyles.flexBetween}>
                <div>
                  <span style={ownerTagStyle}>{meal.ownerEmail}</span>
                  <div style={dateStyle}>
                    {new Date(meal.date).toLocaleDateString("it-IT", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginTop: "15px",
                }}
              >
                {/* Pranzo */}
                <div style={mealBoxStyle(meal.lunchCategory)}>
                  <h4 style={mealHeaderStyle}>Pranzo</h4>
                  <div style={mealContentStyle}>{meal.lunch}</div>
                  <div style={categoryBadgeStyle}>
                    {meal.lunchCategory.charAt(0).toUpperCase() +
                      meal.lunchCategory.slice(1)}
                  </div>
                </div>

                {/* Cena */}
                <div style={mealBoxStyle(meal.dinnerCategory)}>
                  <h4 style={mealHeaderStyle}>Cena</h4>
                  <div style={mealContentStyle}>{meal.dinner}</div>
                  <div style={categoryBadgeStyle}>
                    {meal.dinnerCategory.charAt(0).toUpperCase() +
                      meal.dinnerCategory.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedMealsView;
