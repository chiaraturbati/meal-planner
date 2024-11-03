import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

const DebugSharingView = ({ currentUser }) => {
  const [debugInfo, setDebugInfo] = useState({
    directPlan: null,
    sharedPlans: [],
    accessibleMeals: [],
    errors: [],
    loading: true,
  });

  useEffect(() => {
    const debugSharing = async () => {
      const errors = [];
      const debugData = {
        directPlan: null,
        sharedPlans: [],
        accessibleMeals: [],
        errors: [],
      };

      try {
        // 1. Accesso diretto al piano di Chiara
        const ownerPlanId = "hUvs58mvSKn4aoCuXwah"; // ID del piano di chiara0494
        console.log("🔍 Tentativo accesso diretto al piano:", ownerPlanId);

        try {
          const directPlanRef = doc(db, "mealPlans", ownerPlanId);
          const directPlan = await getDoc(directPlanRef);
          debugData.directPlan = directPlan.exists()
            ? { id: directPlan.id, ...directPlan.data() }
            : null;

          console.log("📄 Piano trovato:", debugData.directPlan);
        } catch (e) {
          errors.push(`Errore accesso diretto: ${e.message}`);
          console.error("❌ Errore accesso diretto:", e);
        }

        // 2. Query per piani condivisi
        console.log("🔍 Query piani condivisi per:", currentUser.email);
        try {
          const sharedPlansQuery = query(
            collection(db, "mealPlans"),
            where(`sharedWith.${currentUser.email}`, "==", true)
          );

          const sharedPlansSnapshot = await getDocs(sharedPlansQuery);
          console.log("📊 Piani trovati:", sharedPlansSnapshot.size);

          debugData.sharedPlans = sharedPlansSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        } catch (e) {
          errors.push(`Errore query piani: ${e.message}`);
          console.error("❌ Errore query piani:", e);
        }

        // 3. Cerca pasti per ogni piano
        console.log("🔍 Ricerca pasti associati");
        for (const plan of debugData.sharedPlans) {
          try {
            const mealsQuery = query(
              collection(db, "meals"),
              where("planId", "==", plan.id)
            );

            const mealsSnapshot = await getDocs(mealsQuery);
            const meals = mealsSnapshot.docs.map((doc) => ({
              id: doc.id,
              planId: plan.id,
              ...doc.data(),
            }));

            debugData.accessibleMeals.push(...meals);
            console.log(`📊 Pasti trovati per piano ${plan.id}:`, meals.length);
          } catch (e) {
            errors.push(`Errore pasti piano ${plan.id}: ${e.message}`);
            console.error(`❌ Errore pasti piano ${plan.id}:`, e);
          }
        }
      } catch (error) {
        errors.push(`Errore generale: ${error.message}`);
        console.error("❌ Errore generale:", error);
      }

      setDebugInfo({
        ...debugData,
        errors,
        loading: false,
      });
    };

    if (currentUser?.email) {
      debugSharing();
    }
  }, [currentUser]);

  if (debugInfo.loading) {
    return <div>Loading debug information...</div>;
  }

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        margin: "20px 0",
      }}
    >
      <h3>Debug Condivisione</h3>

      <div style={{ marginBottom: "20px" }}>
        <h4>Utente Corrente</h4>
        <pre>
          {JSON.stringify(
            {
              email: currentUser?.email,
              uid: currentUser?.uid,
            },
            null,
            2
          )}
        </pre>
      </div>

      {debugInfo.errors.length > 0 && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#fee",
            borderRadius: "4px",
          }}
        >
          <h4>Errori</h4>
          {debugInfo.errors.map((error, i) => (
            <div key={i} style={{ color: "red" }}>
              {error}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <h4>Piano Diretto (chiara0494)</h4>
        {debugInfo.directPlan ? (
          <pre>{JSON.stringify(debugInfo.directPlan, null, 2)}</pre>
        ) : (
          <p>Nessun accesso diretto al piano</p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4>Piani Condivisi ({debugInfo.sharedPlans.length})</h4>
        {debugInfo.sharedPlans.length > 0 ? (
          debugInfo.sharedPlans.map((plan) => (
            <div key={plan.id} style={{ marginBottom: "10px" }}>
              <pre>{JSON.stringify(plan, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p>Nessun piano condiviso trovato</p>
        )}
      </div>

      <div>
        <h4>Pasti Accessibili ({debugInfo.accessibleMeals.length})</h4>
        {debugInfo.accessibleMeals.length > 0 ? (
          debugInfo.accessibleMeals.map((meal) => (
            <div key={meal.id} style={{ marginBottom: "10px" }}>
              <pre>{JSON.stringify(meal, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p>Nessun pasto accessibile trovato</p>
        )}
      </div>
    </div>
  );
};

export default DebugSharingView;
