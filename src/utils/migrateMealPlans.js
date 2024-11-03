// src/utils/migrationUtils.js
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  writeBatch,
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

  if (typeof plan.sharedWith !== "object" || Array.isArray(plan.sharedWith)) {
    throw new Error("sharedWith deve essere un oggetto");
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

      try {
        validatePlanStructure(existingPlan);
        console.log("✅ Struttura piano valida");
      } catch (error) {
        console.warn("⚠️ Piano esistente non valido:", error.message);
        // Aggiorna il piano per correggere la struttura
        const correctedPlan = {
          ...existingPlan,
          sharedWith: Array.isArray(existingPlan.sharedWith)
            ? existingPlan.sharedWith.reduce(
                (acc, email) => ({ ...acc, [email]: true }),
                {}
              )
            : existingPlan.sharedWith || {},
        };

        await updateDoc(doc(db, "mealPlans", existingPlan.id), correctedPlan);
        console.log("✅ Piano corretto e aggiornato");
        return correctedPlan;
      }

      return existingPlan;
    }

    // 2. Creazione nuovo piano
    logMigrationStep("Creazione nuovo piano");
    const newPlanData = {
      userId: currentUser.uid,
      ownerEmail: currentUser.email,
      name: `Piano di ${currentUser.email}`,
      sharedWith: {},
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

      const sharedWithArray = oldSharedData.sharedWith || [];
      const sharedWithObject = sharedWithArray.reduce((acc, email) => {
        acc[email] = true;
        return acc;
      }, {});

      await updateDoc(newPlanRef, { sharedWith: sharedWithObject });
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
