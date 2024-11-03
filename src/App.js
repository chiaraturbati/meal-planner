import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { migrateMealPlans } from "./utils/migrateMealPlans";
import { loadSharedContent } from "./utils/sharedMealsLoader";

// Componenti
import WeeklyView from "./components/WeeklyView";
import MealForm from "./components/MealForm";
import SharingManager from "./components/SharingManager";
import SharedMealsView from "./components/SharedMealsView";
import DebugSharingView from "./utils/debugUtils";

// Stili
import {
  containerStyle,
  typographyStyles,
  primaryButtonStyle,
  inputStyle,
  cardStyle,
  layoutStyles,
} from "./utils/styles";
import { fixDatabaseStructure } from "./utils/fixDatabase";

function App() {
  // Stati per l'autenticazione
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userPlan, setUserPlan] = useState(null);

  // Stati per i pasti
  const [meals, setMeals] = useState([]);
  const [newMeal, setNewMeal] = useState({
    date: "",
    lunch: "",
    dinner: "",
    lunchCategory: "altro",
    dinnerCategory: "altro",
  });
  const [editingMeal, setEditingMeal] = useState(null);

  // Stati per la condivisione
  const [sharedWithUsers, setSharedWithUsers] = useState({});
  const [sharedMeals, setSharedMeals] = useState([]);

  // Stato per la navigazione settimanale
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() - now.getDay() + 1);
    return now.toISOString().split("T")[0];
  });

  // Carica i dati iniziali e gestisce l'auth
  useEffect(() => {
    const loadInitialData = async (user) => {
      try {
        // Fix e migrazione database
        await fixDatabaseStructure(user);
        const plan = await migrateMealPlans(user);

        if (plan) {
          setUserPlan(plan);
          setSharedWithUsers(plan.sharedWith || {});
        }

        // Carica i pasti dell'utente
        if (plan?.id) {
          const mealsQuery = query(
            collection(db, "meals"),
            where("planId", "==", plan.id)
          );
          const mealsSnapshot = await getDocs(mealsQuery);
          const mealsData = mealsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMeals(mealsData);
        }

        // Carica i contenuti condivisi
        const { meals: sharedMealsData } = await loadSharedContent(user);
        setSharedMeals(sharedMealsData);
      } catch (error) {
        console.error("Errore nel caricamento iniziale:", error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadInitialData(user);
      } else {
        setUserPlan(null);
        setMeals([]);
        setSharedWithUsers({});
        setSharedMeals([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Funzioni di gestione pasti
  const loadMeals = async (userId) => {
    if (!userPlan?.id) return;

    try {
      const q = query(
        collection(db, "meals"),
        where("planId", "==", userPlan.id)
      );
      const querySnapshot = await getDocs(q);
      const mealsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMeals(mealsData);
    } catch (error) {
      console.error("Error loading meals:", error);
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!user || !newMeal.date || !userPlan?.id) return;

    try {
      const mealData = {
        ...newMeal,
        userId: user.uid,
        planId: userPlan.id,
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
      loadMeals(user.uid);
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
      loadMeals(user.uid);
    } catch (error) {
      console.error("Error editing meal:", error);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo pasto?")) return;

    try {
      await deleteDoc(doc(db, "meals", mealId));
      loadMeals(user.uid);
    } catch (error) {
      console.error("Error deleting meal:", error);
    }
  };

  const handleCopyMeal = async (sourceMeal, targetDate) => {
    if (!userPlan?.id) return;

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
        planId: userPlan.id,
        date: targetDate,
        lunch: sourceMeal.lunch,
        dinner: sourceMeal.dinner,
        lunchCategory: sourceMeal.lunchCategory,
        dinnerCategory: sourceMeal.dinnerCategory,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "meals"), newMealData);
      loadMeals(user.uid);
    } catch (error) {
      console.error("Error copying meal:", error);
    }
  };

  // Funzioni di autenticazione
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Errore di login: " + error.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error signing up:", error);
      alert("Errore di registrazione: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Funzioni di utility
  const getWeekDates = () => {
    const dates = [];
    const startDate = new Date(currentWeek);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates.reverse();
  };

  const getMealsForDate = (date) => {
    return meals.find((meal) => meal.date === date) || null;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeek(newDate.toISOString().split("T")[0]);
  };

  // Rendering della pagina di login
  if (!user) {
    return (
      <div style={{ ...containerStyle, maxWidth: "400px" }}>
        <div style={cardStyle}>
          <h1 style={typographyStyles.h1}>Meal Planner</h1>
          <form onSubmit={handleLogin} style={layoutStyles.grid}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" style={primaryButtonStyle}>
              Login
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              style={{ ...primaryButtonStyle, backgroundColor: "#2196F3" }}
            >
              Registrati
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isDev = process.env.NODE_ENV === "development";

  // Rendering della dashboard principale
  return (
    <div style={containerStyle}>
      {isDev && <DebugSharingView currentUser={user} />}
      <div style={layoutStyles.flexBetween}>
        <h1 style={typographyStyles.h1}>Meal Planner</h1>
        <div style={layoutStyles.flex}>
          <span style={{ alignSelf: "center" }}>{user.email}</span>
          <button
            onClick={handleLogout}
            style={{ ...primaryButtonStyle, backgroundColor: "#757575" }}
          >
            Logout
          </button>
        </div>
      </div>

      <WeeklyView
        currentWeek={currentWeek}
        navigateWeek={navigateWeek}
        getWeekDates={getWeekDates}
        getMealsForDate={getMealsForDate}
        setEditingMeal={setEditingMeal}
        handleDeleteMeal={handleDeleteMeal}
        handleCopyMeal={handleCopyMeal}
      />

      <MealForm
        editingMeal={editingMeal}
        newMeal={newMeal}
        setNewMeal={setNewMeal}
        setEditingMeal={setEditingMeal}
        handleAddMeal={handleAddMeal}
        handleEditMeal={handleEditMeal}
      />

      {userPlan && (
        <SharingManager
          planId={userPlan.id}
          sharedWithUsers={sharedWithUsers}
        />
      )}

      <SharedMealsView sharedMeals={sharedMeals} />
    </div>
  );
}

export default App;
