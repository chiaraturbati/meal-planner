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
    userPlans: [],
    sharedPlansObject: [], // Piani trovati con query object-based
    sharedPlansArray: [], // Piani trovati con query array-based
    accessibleMeals: [],
    errors: [],
    queries: [], // Storico delle query eseguite
    loading: true,
  });

  useEffect(() => {
    const debugSharing = async () => {
      const errors = [];
      const queries = [];
      const debugData = {
        userPlans: [],
        sharedPlansObject: [],
        sharedPlansArray: [],
        accessibleMeals: [],
        queries: [],
        errors: [],
      };

      try {
        // 1. Cerca i piani dell'utente corrente
        console.log("🔍 Ricerca piani dell'utente:", currentUser.email);
        try {
          const userPlansQuery = query(
            collection(db, "mealPlans"),
            where("userId", "==", currentUser.uid)
          );
          queries.push({
            type: "userPlans",
            query: "where('userId', '==', currentUser.uid)",
          });

          const userPlansSnapshot = await getDocs(userPlansQuery);
          debugData.userPlans = userPlansSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("📊 Piani utente trovati:", {
            count: userPlansSnapshot.size,
            plans: debugData.userPlans,
          });
        } catch (e) {
          errors.push(`Errore ricerca piani utente: ${e.message}`);
          console.error("❌ Errore ricerca piani utente:", e);
        }

        // 2. Query per piani condivisi (object-based)
        console.log(
          "🔍 Query piani condivisi (object) per:",
          currentUser.email
        );
        try {
          const sharedPlansObjectQuery = query(
            collection(db, "mealPlans"),
            where(`sharedWith.${currentUser.email}`, "==", true)
          );
          queries.push({
            type: "sharedPlansObject",
            query: `where('sharedWith.${currentUser.email}', '==', true)`,
          });

          const sharedPlansObjectSnapshot = await getDocs(
            sharedPlansObjectQuery
          );
          debugData.sharedPlansObject = sharedPlansObjectSnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );
          console.log("📊 Piani condivisi (object) trovati:", {
            count: sharedPlansObjectSnapshot.size,
            plans: debugData.sharedPlansObject,
          });
        } catch (e) {
          errors.push(`Errore query piani (object): ${e.message}`);
          console.error("❌ Errore query piani (object):", e);
        }

        // 3. Query per piani condivisi (array-based)
        console.log("🔍 Query piani condivisi (array) per:", currentUser.email);
        try {
          const sharedPlansArrayQuery = query(
            collection(db, "mealPlans"),
            where("sharedWith", "array-contains", currentUser.email)
          );
          queries.push({
            type: "sharedPlansArray",
            query: "where('sharedWith', 'array-contains', currentUser.email)",
          });

          const sharedPlansArraySnapshot = await getDocs(sharedPlansArrayQuery);
          debugData.sharedPlansArray = sharedPlansArraySnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );
          console.log("📊 Piani condivisi (array) trovati:", {
            count: sharedPlansArraySnapshot.size,
            plans: debugData.sharedPlansArray,
          });
        } catch (e) {
          errors.push(`Errore query piani (array): ${e.message}`);
          console.error("❌ Errore query piani (array):", e);
        }

        // 4. Cerca pasti per ogni piano
        const allPlans = [
          ...debugData.userPlans,
          ...debugData.sharedPlansObject,
          ...debugData.sharedPlansArray,
        ];

        console.log("🔍 Ricerca pasti per", allPlans.length, "piani");
        for (const plan of allPlans) {
          try {
            const mealsQuery = query(
              collection(db, "meals"),
              where("planId", "==", plan.id)
            );
            queries.push({
              type: "meals",
              planId: plan.id,
              query: `where('planId', '==', '${plan.id}')`,
            });

            const mealsSnapshot = await getDocs(mealsQuery);
            const meals = mealsSnapshot.docs.map((doc) => ({
              id: doc.id,
              planId: plan.id,
              ...doc.data(),
            }));

            debugData.accessibleMeals.push(...meals);
            console.log(`📊 Pasti trovati per piano ${plan.id}:`, {
              count: meals.length,
              meals,
            });
          } catch (e) {
            errors.push(`Errore pasti piano ${plan.id}: ${e.message}`);
            console.error(`❌ Errore pasti piano ${plan.id}:`, e);
          }
        }

        debugData.queries = queries;
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
        fontSize: "14px",
      }}
    >
      <h3>Debug Condivisione Avanzato</h3>

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

      <div style={{ marginBottom: "20px" }}>
        <h4>Query Eseguite</h4>
        <pre>{JSON.stringify(debugInfo.queries, null, 2)}</pre>
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
        <h4>Piani Proprietari ({debugInfo.userPlans.length})</h4>
        {debugInfo.userPlans.length > 0 ? (
          debugInfo.userPlans.map((plan) => (
            <div key={plan.id} style={{ marginBottom: "10px" }}>
              <pre>{JSON.stringify(plan, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p>Nessun piano proprietario trovato</p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4>
          Piani Condivisi - Query Oggetto ({debugInfo.sharedPlansObject.length})
        </h4>
        {debugInfo.sharedPlansObject.length > 0 ? (
          debugInfo.sharedPlansObject.map((plan) => (
            <div key={plan.id} style={{ marginBottom: "10px" }}>
              <pre>{JSON.stringify(plan, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p>Nessun piano condiviso trovato (query oggetto)</p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4>
          Piani Condivisi - Query Array ({debugInfo.sharedPlansArray.length})
        </h4>
        {debugInfo.sharedPlansArray.length > 0 ? (
          debugInfo.sharedPlansArray.map((plan) => (
            <div key={plan.id} style={{ marginBottom: "10px" }}>
              <pre>{JSON.stringify(plan, null, 2)}</pre>
            </div>
          ))
        ) : (
          <p>Nessun piano condiviso trovato (query array)</p>
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
