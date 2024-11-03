import React, { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const SharingManager = ({ planId, sharedWithUsers = {} }) => {
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const planRef = doc(db, "mealPlans", planId);
      await updateDoc(planRef, {
        sharedWith: {
          ...sharedWithUsers,
          [newEmail]: true,
        },
      });

      setNewEmail("");
    } catch (error) {
      console.error("Error sharing plan:", error);
      setError("Errore nella condivisione del piano");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (emailToRemove) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedSharedWith = { ...sharedWithUsers };
      delete updatedSharedWith[emailToRemove];

      const planRef = doc(db, "mealPlans", planId);
      await updateDoc(planRef, {
        sharedWith: updatedSharedWith,
      });
    } catch (error) {
      console.error("Error removing share:", error);
      setError("Errore nella rimozione della condivisione");
    } finally {
      setIsLoading(false);
    }
  };

  // Converti l'oggetto sharedWithUsers in un array di email per il rendering
  const sharedEmails = Object.keys(sharedWithUsers || {});

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        backgroundColor: "#fff",
        borderRadius: "0.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        Gestione Condivisioni
      </h2>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}

      <form
        onSubmit={handleShare}
        style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}
      >
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email da aggiungere"
          style={{
            flexGrow: 1,
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "0.25rem",
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Condivisione..." : "Condividi"}
        </button>
      </form>

      <div>
        <h3 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
          Condiviso con:
        </h3>
        {sharedEmails.length > 0 ? (
          <ul
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {sharedEmails.map((email) => (
              <li
                key={email}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem",
                  backgroundColor: "#F3F4F6",
                  borderRadius: "0.25rem",
                }}
              >
                <span>{email}</span>
                <button
                  onClick={() => handleRemoveShare(email)}
                  disabled={isLoading}
                  style={{
                    padding: "0.25rem 0.75rem",
                    color: "#DC2626",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#6B7280" }}>Nessuna condivisione attiva</p>
        )}
      </div>
    </div>
  );
};

export default SharingManager;
