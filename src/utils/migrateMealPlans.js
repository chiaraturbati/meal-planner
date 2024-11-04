import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const logMigrationStep = (step, details = null) => {
  console.group(`📦 Migrazione: ${step}`);
  if (details) {
    console.log(details);
  }
  console.groupEnd();
};

export const validatePlanStructure = (plan) => {
  const requiredFields = [
    "userId",
    "ownerEmail",
    "name",
    "sharedWith",
    "createdAt",
  ];
  const missingFields = requiredFields.filter((field) => !(field in plan));

  if (missingFields.length > 0) {
    throw new Error(
      `Piano non valido. Campi mancanti: ${missingFields.join(", ")}`
    );
  }

  // Modifica: ora sharedWith deve essere un array
  if (!Array.isArray(plan.sharedWith)) {
    throw new Error("sharedWith deve essere un array");
  }

  return true;
};

export const validateMealStructure = (meal) => {
  const requiredFields = ["userId", "planId", "date"];
  const missingFields = requiredFields.filter((field) => !(field in meal));

  if (missingFields.length > 0) {
    throw new Error(
      `Pasto non valido. Campi mancanti: ${missingFields.join(", ")}`
    );
  }

  return true;
};

export const migrateMealPlans = async (currentUser) => {
  console.group("🚀 Inizio Migrazione");
  console.log("👤 Utente:", currentUser.email);

  if (!currentUser) {
    console.error("❌ Nessun utente fornito per la migrazione");
    console.groupEnd();
    return null;
  }

  try {
    // 1. Verifica piano esistente
    logMigrationStep("Verifica piano esistente");
    const planQuery = query(
      collection(db, "mealPlans"),
      where("userId", "==", currentUser.uid)
    );
    const planSnapshot = await getDocs(planQuery);

    // Se esiste, valida e ritorna il piano esistente
    if (!planSnapshot.empty) {
      const existingPlan = {
        id: planSnapshot.docs[0].id,
        ...planSnapshot.docs[0].data(),
      };

      logMigrationStep("Piano esistente trovato", existingPlan);

      // Forza la conversione di sharedWith
      if (
        typeof existingPlan.sharedWith === "object" &&
        !Array.isArray(existingPlan.sharedWith)
      ) {
        console.log("🔄 Conversione forzata sharedWith da oggetto ad array");
        const sharedWithArray = Object.entries(existingPlan.sharedWith)
          .filter(([_, value]) => value === true)
          .map(([email]) => email);

        // Aggiorna immediatamente il documento
        await updateDoc(doc(db, "mealPlans", existingPlan.id), {
          sharedWith: sharedWithArray,
        });

        // Aggiorna anche l'oggetto in memoria
        existingPlan.sharedWith = sharedWithArray;
        console.log("✅ Struttura sharedWith aggiornata", sharedWithArray);
      }

      logMigrationStep("Piano esistente trovato", existingPlan);

      // Converti sharedWith da oggetto ad array se necessario
      if (
        typeof existingPlan.sharedWith === "object" &&
        !Array.isArray(existingPlan.sharedWith)
      ) {
        console.log("🔄 Conversione sharedWith da oggetto ad array");
        const sharedWithArray = Object.entries(existingPlan.sharedWith)
          .filter(([_, value]) => value === true)
          .map(([email]) => email);

        existingPlan.sharedWith = sharedWithArray;
        await updateDoc(doc(db, "mealPlans", existingPlan.id), {
          sharedWith: sharedWithArray,
        });
        console.log("✅ Struttura sharedWith aggiornata", sharedWithArray);
      }

      try {
        validatePlanStructure(existingPlan);
        console.log("✅ Struttura piano valida");
        return existingPlan;
      } catch (error) {
        console.warn("⚠️ Piano esistente non valido:", error.message);
        // Se c'è qualche altro problema oltre sharedWith
        const correctedPlan = {
          ...existingPlan,
          sharedWith: Array.isArray(existingPlan.sharedWith)
            ? existingPlan.sharedWith
            : [],
        };

        await updateDoc(doc(db, "mealPlans", existingPlan.id), correctedPlan);
        console.log("✅ Piano corretto e aggiornato");
        return correctedPlan;
      }
    }

    // 2. Creazione nuovo piano
    logMigrationStep("Creazione nuovo piano");
    const newPlanData = {
      userId: currentUser.uid,
      ownerEmail: currentUser.email,
      name: `Piano di ${currentUser.email}`,
      sharedWith: [], // Inizializza come array vuoto
      createdAt: new Date().toISOString(),
    };

    validatePlanStructure(newPlanData);
    const newPlanRef = await addDoc(collection(db, "mealPlans"), newPlanData);
    console.log("✅ Nuovo piano creato:", newPlanRef.id);

    // 3. Migrazione pasti esistenti
    logMigrationStep("Migrazione pasti esistenti");
    const oldMealsQuery = query(
      collection(db, "meals"),
      where("userId", "==", currentUser.uid)
    );
    const oldMealsSnapshot = await getDocs(oldMealsQuery);
    console.log(`📊 Trovati ${oldMealsSnapshot.size} pasti da migrare`);

    const migrationPromises = oldMealsSnapshot.docs.map(async (mealDoc) => {
      try {
        const mealData = {
          ...mealDoc.data(),
          planId: newPlanRef.id,
        };
        validateMealStructure(mealData);
        const newMealRef = await addDoc(collection(db, "meals"), mealData);
        console.log(`✅ Pasto migrato: ${newMealRef.id}`);
      } catch (error) {
        console.error(`❌ Errore migrazione pasto ${mealDoc.id}:`, error);
      }
    });

    await Promise.all(migrationPromises);

    // 4. Migrazione condivisioni
    logMigrationStep("Migrazione condivisioni");
    const oldShareQuery = query(
      collection(db, "sharedMeals"),
      where("ownerId", "==", currentUser.uid)
    );
    const oldShareSnapshot = await getDocs(oldShareQuery);

    if (!oldShareSnapshot.empty) {
      const oldSharedData = oldShareSnapshot.docs[0].data();
      console.log("📤 Dati condivisione trovati:", oldSharedData);

      // Converti direttamente in array
      const sharedWithArray = Array.isArray(oldSharedData.sharedWith)
        ? oldSharedData.sharedWith
        : Object.entries(oldSharedData.sharedWith || {})
            .filter(([_, value]) => value === true)
            .map(([email]) => email);

      await updateDoc(newPlanRef, { sharedWith: sharedWithArray });
      console.log("✅ Condivisioni migrate con successo");
    } else {
      console.log("ℹ️ Nessuna condivisione da migrare");
    }

    // 5. Verifica finale e ritorno
    logMigrationStep("Verifica finale");
    const newPlan = await getDoc(newPlanRef);
    const finalPlan = {
      id: newPlan.id,
      ...newPlan.data(),
    };

    try {
      validatePlanStructure(finalPlan);
      console.log("✅ Struttura piano finale valida");
    } catch (error) {
      console.error("❌ Errore nella struttura finale:", error);
      throw error;
    }

    console.log("🎉 Migrazione completata con successo");
    console.groupEnd();
    return finalPlan;
  } catch (error) {
    console.error("❌ Errore critico durante la migrazione:", error);
    console.groupEnd();
    throw error;
  }
};
