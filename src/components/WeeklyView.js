// src/components/WeeklyView.js
import React, { useState } from "react";
import {
  getCategoryStyle,
  secondaryButtonStyle,
  typographyStyles,
  layoutStyles,
} from "../utils/styles";

const WeeklyView = ({
  currentWeek,
  navigateWeek,
  getWeekDates,
  getMealsForDate,
  setEditingMeal,
  handleDeleteMeal,
  handleCopyMeal, // Nuova prop per gestire la copia
}) => {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [mealToCopy, setMealToCopy] = useState(null);
  const [targetDate, setTargetDate] = useState("");

  const isToday = (date) => {
    const today = new Date();
    return new Date(date).toDateString() === today.toDateString();
  };

  const isPastDate = (date) => {
    return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const getShortDay = (date) => {
    return new Date(date)
      .toLocaleDateString("it-IT", { weekday: "short" })
      .toUpperCase();
  };

  const getSortedDates = () => {
    const dates = getWeekDates();
    const today = new Date().toISOString().split("T")[0];

    const todayIndex = dates.indexOf(today);
    if (todayIndex !== -1) {
      return [
        today,
        ...dates.slice(0, todayIndex),
        ...dates.slice(todayIndex + 1),
      ];
    }
    return dates;
  };

  // Modal per la copia dei pasti
  const CopyMealModal = () => {
    if (!showCopyModal || !mealToCopy) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "24px",
            width: "90%",
            maxWidth: "500px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Copia pasto</h3>

          <div style={{ marginBottom: "20px" }}>
            <p style={{ margin: "0 0 10px 0", fontWeight: "500" }}>
              Da:{" "}
              {new Date(mealToCopy.date).toLocaleDateString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <p style={{ margin: "0 0 8px 0" }}>
                <span role="img" aria-label="pranzo">
                  ☀️
                </span>{" "}
                Pranzo: {mealToCopy.lunch}
              </p>
              <p style={{ margin: "0" }}>
                <span role="img" aria-label="cena">
                  🌙
                </span>{" "}
                Cena: {mealToCopy.dinner}
              </p>
            </div>

            <label style={{ display: "block", marginBottom: "8px" }}>
              Copia a:
            </label>
            <select
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                marginBottom: "20px",
              }}
            >
              <option value="">Seleziona una data</option>
              {getWeekDates()
                .filter((date) => date !== mealToCopy.date)
                .map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </option>
                ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => {
                setShowCopyModal(false);
                setMealToCopy(null);
                setTargetDate("");
              }}
              style={{
                ...secondaryButtonStyle,
                padding: "8px 16px",
              }}
            >
              Annulla
            </button>
            <button
              onClick={() => {
                if (targetDate) {
                  handleCopyMeal(mealToCopy, targetDate);
                  setShowCopyModal(false);
                  setMealToCopy(null);
                  setTargetDate("");
                }
              }}
              disabled={!targetDate}
              style={{
                ...secondaryButtonStyle,
                backgroundColor: targetDate ? "#4CAF50" : "#ccc",
                color: "white",
                padding: "8px 16px",
              }}
            >
              Copia
            </button>
          </div>
        </div>
      </div>
    );
  };

  const mealCardStyle = (category) => ({
    padding: "15px",
    borderRadius: "12px",
    backgroundColor: "white",
    border: `2px solid ${getCategoryStyle(category).backgroundColor}`,
    color: "#333",
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
  });

  const actionButtonStyle = {
    base: {
      padding: "6px 12px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "0.9em",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      transition: "all 0.2s ease",
      color: "white",
    },
    edit: {
      backgroundColor: "#2196F3",
      "&:hover": { backgroundColor: "#1976D2" },
    },
    delete: {
      backgroundColor: "#ef4444",
      "&:hover": { backgroundColor: "#dc2626" },
    },
    copy: {
      backgroundColor: "#9c27b0",
      "&:hover": { backgroundColor: "#7b1fa2" },
    },
  };

  return (
    <div style={{ marginBottom: "40px" }}>
      <CopyMealModal />

      {/* Header settimanale */}
      <div
        style={{
          ...layoutStyles.flexBetween,
          margin: "30px 0",
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <button
          onClick={() => navigateWeek(-1)}
          style={{
            ...secondaryButtonStyle,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ←<span className="hidden sm:inline">Settimana precedente</span>
        </button>
        <h2 style={typographyStyles.h2}>
          {new Date(currentWeek).toLocaleDateString("it-IT", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button
          onClick={() => navigateWeek(1)}
          style={{
            ...secondaryButtonStyle,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span className="hidden sm:inline">Settimana successiva</span>→
        </button>
      </div>

      {/* Griglia dei giorni */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {getSortedDates().map((date, index) => {
          const meal = getMealsForDate(date);
          const isCurrentDay = isToday(date);
          const isPast = isPastDate(date);

          return (
            <div
              key={date}
              style={{
                padding: "20px",
                borderRadius: "16px",
                backgroundColor: isCurrentDay ? "#f0f9ff" : "white",
                border: isCurrentDay
                  ? "2px solid #3b82f6"
                  : "1px solid #e5e7eb",
                boxShadow: isCurrentDay
                  ? "0 4px 12px rgba(59, 130, 246, 0.15)"
                  : "0 2px 4px rgba(0, 0, 0, 0.05)",
                opacity: isPast ? 0.7 : 1,
                position: "relative",
                order: isCurrentDay ? -1 : index,
                gridRow: isCurrentDay ? "1" : "auto",
              }}
            >
              {isCurrentDay && (
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    right: "20px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "0.85em",
                    fontWeight: "500",
                  }}
                >
                  Oggi
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  marginBottom: "15px",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "1.1em",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {getShortDay(date)}
                </span>
                <span
                  style={{
                    fontSize: "1.4em",
                    fontWeight: "bold",
                    color: isCurrentDay ? "#3b82f6" : "#111827",
                  }}
                >
                  {new Date(date).getDate()}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {/* Pranzo */}
                <div style={mealCardStyle(meal?.lunchCategory || "altro")}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      role="img"
                      aria-label="pranzo"
                      style={{ fontSize: "1.2em" }}
                    >
                      ☀️
                    </span>
                    <h4 style={{ margin: 0, fontWeight: "600" }}>Pranzo</h4>
                  </div>
                  <div style={{ fontSize: "0.95em", marginBottom: "8px" }}>
                    {meal?.lunch || "Nessun pasto programmato"}
                  </div>
                  {meal?.lunch && (
                    <div
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "0.85em",
                        backgroundColor: getCategoryStyle(meal.lunchCategory)
                          .backgroundColor,
                        color: "white",
                      }}
                    >
                      {meal.lunchCategory}
                    </div>
                  )}
                </div>

                {/* Cena */}
                <div style={mealCardStyle(meal?.dinnerCategory || "altro")}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      role="img"
                      aria-label="cena"
                      style={{ fontSize: "1.2em" }}
                    >
                      🌙
                    </span>
                    <h4 style={{ margin: 0, fontWeight: "600" }}>Cena</h4>
                  </div>
                  <div style={{ fontSize: "0.95em", marginBottom: "8px" }}>
                    {meal?.dinner || "Nessun pasto programmato"}
                  </div>
                  {meal?.dinner && (
                    <div
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "0.85em",
                        backgroundColor: getCategoryStyle(meal.dinnerCategory)
                          .backgroundColor,
                        color: "white",
                      }}
                    >
                      {meal.dinnerCategory}
                    </div>
                  )}
                </div>

                {/* Pulsanti azioni */}
                {meal && !isPast && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => setEditingMeal(meal)}
                      style={{
                        ...actionButtonStyle.base,
                        ...actionButtonStyle.edit,
                        flex: 1,
                      }}
                    >
                      <span role="img" aria-label="modifica">
                        ✏️
                      </span>
                      Modifica
                    </button>
                    <button
                      onClick={() => {
                        setMealToCopy({ ...meal, date });
                        setShowCopyModal(true);
                      }}
                      style={{
                        ...actionButtonStyle.base,
                        ...actionButtonStyle.copy,
                        flex: 1,
                      }}
                    >
                      <span role="img" aria-label="copia">
                        📋
                      </span>
                      Copia
                    </button>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      style={{
                        ...actionButtonStyle.base,
                        ...actionButtonStyle.delete,
                        flex: 1,
                      }}
                    >
                      <span role="img" aria-label="elimina">
                        🗑️
                      </span>
                      Elimina
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyView;
