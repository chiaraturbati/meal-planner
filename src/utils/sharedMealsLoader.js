// src/utils/sharedMealsLoader.js
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export const loadSharedContent = async (currentUser) => {
  if (!currentUser?.email) {
    return { plans: [], meals: [] };
  }

  try {
    // 1. Carica il piano di cui conosciamo l'ID
    const knownPlanId = "hUvs58mvSKn4aoCuXwah";
    const knownPlanRef = doc(db, "mealPlans", knownPlanId);
    const knownPlanDoc = await getDoc(knownPlanRef);

    let sharedPlans = [];
    if (
      knownPlanDoc.exists() &&
      knownPlanDoc.data().sharedWith?.[currentUser.email]
    ) {
      sharedPlans.push({
        id: knownPlanDoc.id,
        ...knownPlanDoc.data(),
      });
    }

    // 2. Carica i pasti per i piani condivisi
    const sharedMeals = [];
    for (const plan of sharedPlans) {
      try {
        const mealsQuery = query(
          collection(db, "meals"),
          where("planId", "==", plan.id)
        );

        const mealsSnapshot = await getDocs(mealsQuery);
        const meals = mealsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          ownerEmail: plan.ownerEmail || "Sconosciuto",
          ownerName: plan.name || `Piano di ${plan.ownerEmail}`,
        }));

        sharedMeals.push(...meals);
      } catch (error) {
        console.warn(
          `Errore nel caricamento dei pasti per il piano ${plan.id}:`,
          error
        );
        continue;
      }
    }

    // Ordina i pasti per data
    const sortedMeals = sharedMeals.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    console.log("Debug - Piani condivisi trovati:", sharedPlans.length);
    console.log("Debug - Pasti condivisi trovati:", sortedMeals.length);

    return {
      plans: sharedPlans,
      meals: sortedMeals,
    };
  } catch (error) {
    console.error("Errore nel caricamento dei contenuti condivisi:", error);
    throw error;
  }
};
