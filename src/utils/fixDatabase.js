import { db } from "../firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export const fixDatabaseStructure = async (user) => {
  if (!user) return;

  try {
    // 1. Trova e correggi il piano
    const planQuery = query(
      collection(db, "mealPlans"),
      where("userId", "==", user.uid)
    );
    const planSnapshot = await getDocs(planQuery);

    // Se non c'è un piano, non c'è niente da correggere
    if (planSnapshot.empty) {
      return false;
    }

    const planDoc = planSnapshot.docs[0];
    const planData = planDoc.data();
    const planId = planDoc.id;

    // Aggiorna il piano solo se necessario
    if (!planData.ownerEmail || !planData.sharedWith) {
      await updateDoc(doc(db, "mealPlans", planId), {
        ownerEmail: user.email,
        sharedWith: planData.sharedWith || {},
      });
    }

    // 2. Trova e correggi i pasti senza planId
    const mealsQuery = query(
      collection(db, "meals"),
      where("userId", "==", user.uid)
    );
    const mealsSnapshot = await getDocs(mealsQuery);

    // Aggiorna solo i pasti che non hanno planId
    const updatePromises = mealsSnapshot.docs
      .filter((mealDoc) => !mealDoc.data().planId)
      .map((mealDoc) => updateDoc(doc(db, "meals", mealDoc.id), { planId }));

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    return true;
  } catch (error) {
    return false;
  }
};
