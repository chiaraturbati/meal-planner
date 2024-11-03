import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export const useMealPlan = (user) => {
  const [ownPlan, setOwnPlan] = useState(null);
  const [sharedPlans, setSharedPlans] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadPlans = async () => {
      setLoading(true);
      try {
        // Carica il piano personale
        const planQuery = query(
          collection(db, "mealPlans"),
          where("userId", "==", user.uid)
        );
        const planSnapshot = await getDocs(planQuery);
        if (!planSnapshot.empty) {
          setOwnPlan(planSnapshot.docs[0].data());
        }

        // Carica i piani condivisi
        const sharedQuery = query(
          collection(db, "mealPlans"),
          where("sharedWith", "array-contains", user.email)
        );
        const sharedSnapshot = await getDocs(sharedQuery);
        setSharedPlans(
          sharedSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        // Imposta listener per i pasti
        const unsubscribe = onSnapshot(
          query(
            collection(db, "meals"),
            where("planId", "in", [
              planSnapshot.docs[0]?.id,
              ...sharedSnapshot.docs.map((doc) => doc.id),
            ])
          ),
          (snapshot) => {
            const mealsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setMeals(mealsData);
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("Error loading meal plans:", error);
        setLoading(false);
      }
    };

    loadPlans();
  }, [user]);

  return { ownPlan, sharedPlans, meals, loading };
};
