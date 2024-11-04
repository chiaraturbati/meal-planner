// src/hooks/useMeals.js
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export const useMeals = (activePlanId, user) => {
  const [meals, setMeals] = useState([]);
  const [newMeal, setNewMeal] = useState({
    date: "",
    lunch: "",
    dinner: "",
    lunchCategory: "altro",
    dinnerCategory: "altro",
  });
  const [editingMeal, setEditingMeal] = useState(null);

  useEffect(() => {
    if (!activePlanId) return;

    const mealsRef = collection(db, "meals");
    const q = query(mealsRef, where("planId", "==", activePlanId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mealsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMeals(mealsData);
    });

    return () => unsubscribe();
  }, [activePlanId]);

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!user || !newMeal.date || !activePlanId) return;

    try {
      const mealData = {
        ...newMeal,
        userId: user.uid,
        planId: activePlanId,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "meals"), mealData);
      setNewMeal({
        date: "",
        lunch: "",
        dinner: "",
        lunchCategory: "altro",
        dinnerCategory: "altro",
      });
    } catch (error) {
      console.error("Error adding meal:", error);
    }
  };

  const handleEditMeal = async (e) => {
    e.preventDefault();
    if (!editingMeal) return;

    try {
      await updateDoc(doc(db, "meals", editingMeal.id), {
        lunch: editingMeal.lunch,
        dinner: editingMeal.dinner,
        lunchCategory: editingMeal.lunchCategory,
        dinnerCategory: editingMeal.dinnerCategory,
      });
      setEditingMeal(null);
    } catch (error) {
      console.error("Error editing meal:", error);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo pasto?")) return;

    try {
      await deleteDoc(doc(db, "meals", mealId));
    } catch (error) {
      console.error("Error deleting meal:", error);
    }
  };

  const handleCopyMeal = async (sourceMeal, targetDate) => {
    if (!activePlanId) return;

    try {
      const existingMeal = getMealsForDate(targetDate);
      if (existingMeal) {
        if (
          !window.confirm(
            "Esiste già un pasto per questa data. Vuoi sovrascriverlo?"
          )
        ) {
          return;
        }
        await deleteDoc(doc(db, "meals", existingMeal.id));
      }

      const newMealData = {
        userId: user.uid,
        planId: activePlanId,
        date: targetDate,
        lunch: sourceMeal.lunch,
        dinner: sourceMeal.dinner,
        lunchCategory: sourceMeal.lunchCategory,
        dinnerCategory: sourceMeal.dinnerCategory,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "meals"), newMealData);
    } catch (error) {
      console.error("Error copying meal:", error);
    }
  };

  const getMealsForDate = (date) => {
    return meals.find((meal) => meal.date === date) || null;
  };

  return {
    meals,
    newMeal,
    setNewMeal,
    editingMeal,
    setEditingMeal,
    handleAddMeal,
    handleEditMeal,
    handleDeleteMeal,
    handleCopyMeal,
    getMealsForDate,
  };
};
