// src/components/MealForm.js
import React from "react";
import { primaryButtonStyle, secondaryButtonStyle } from "../utils/styles";

const categories = [
  "vegetariano",
  "pesce",
  "carne",
  "legumi",
  "zuppa",
  "altro",
];

const MealForm = ({
  editingMeal,
  newMeal,
  setNewMeal,
  setEditingMeal,
  handleAddMeal,
  handleEditMeal,
}) => {
  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "10px",
    fontSize: "16px",
  };

  const selectStyle = {
    ...inputStyle,
    marginBottom: 0,
    backgroundColor: "white",
  };

  return (
    <div
      style={{
        marginBottom: "30px",
        padding: "25px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: "#333" }}>
        {editingMeal ? "Modifica Pasto" : "Aggiungi Nuovo Pasto"}
      </h2>

      <form onSubmit={editingMeal ? handleEditMeal : handleAddMeal}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {!editingMeal && (
            <input
              type="date"
              value={newMeal.date}
              onChange={(e) => setNewMeal({ ...newMeal, date: e.target.value })}
              style={{
                ...inputStyle,
                gridColumn: "1 / -1",
              }}
            />
          )}

          <div>
            <input
              type="text"
              placeholder="Pranzo"
              value={editingMeal ? editingMeal.lunch : newMeal.lunch}
              onChange={(e) =>
                editingMeal
                  ? setEditingMeal({ ...editingMeal, lunch: e.target.value })
                  : setNewMeal({ ...newMeal, lunch: e.target.value })
              }
              style={inputStyle}
            />
            <select
              value={
                editingMeal ? editingMeal.lunchCategory : newMeal.lunchCategory
              }
              onChange={(e) =>
                editingMeal
                  ? setEditingMeal({
                      ...editingMeal,
                      lunchCategory: e.target.value,
                    })
                  : setNewMeal({ ...newMeal, lunchCategory: e.target.value })
              }
              style={selectStyle}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="text"
              placeholder="Cena"
              value={editingMeal ? editingMeal.dinner : newMeal.dinner}
              onChange={(e) =>
                editingMeal
                  ? setEditingMeal({ ...editingMeal, dinner: e.target.value })
                  : setNewMeal({ ...newMeal, dinner: e.target.value })
              }
              style={inputStyle}
            />
            <select
              value={
                editingMeal
                  ? editingMeal.dinnerCategory
                  : newMeal.dinnerCategory
              }
              onChange={(e) =>
                editingMeal
                  ? setEditingMeal({
                      ...editingMeal,
                      dinnerCategory: e.target.value,
                    })
                  : setNewMeal({ ...newMeal, dinnerCategory: e.target.value })
              }
              style={selectStyle}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: "25px", display: "flex", gap: "10px" }}>
          <button type="submit" style={primaryButtonStyle}>
            {editingMeal ? "Salva Modifiche" : "Aggiungi Pasto"}
          </button>

          {editingMeal && (
            <button
              type="button"
              onClick={() => setEditingMeal(null)}
              style={secondaryButtonStyle}
            >
              Annulla
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MealForm;
