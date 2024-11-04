import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { migrateMealPlans } from "./utils/migrateMealPlans";

// Componenti
import WeeklyView from "./components/WeeklyView";
import MealForm from "./components/MealForm";
import SharingManager from "./components/SharingManager";
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

  // Stati per i piani pasto
  const [activePlanId, setActivePlanId] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [sharedWithUsers, setSharedWithUsers] = useState([]);

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

  // Stato per la navigazione settimanale
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() - now.getDay() + 1);
    return now.toISOString().split("T")[0];
  });

  // Gestione autenticazione e caricamento dati iniziale
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          // Fix database e migrazione
          await fixDatabaseStructure(user);
          const migratedPlan = await migrateMealPlans(user);

          // Ora che abbiamo migrato, possiamo caricare i piani
          const loadPlans = async () => {
            const plansRef = collection(db, "mealPlans");

            // Prima carica i piani di proprietà
            const ownedPlansQuery = query(
              plansRef,
              where("userId", "==", user.uid)
            );

            // Poi carica i piani condivisi
            const sharedPlansQuery = query(
              plansRef,
              where("sharedWith", "array-contains", user.email)
            );

            // Usa onSnapshot per entrambe le queries
            const unsubOwned = onSnapshot(ownedPlansQuery, (snapshot) => {
              const ownedPlans = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                isOwner: true,
              }));

              const unsubShared = onSnapshot(
                sharedPlansQuery,
                (sharedSnapshot) => {
                  const sharedPlans = sharedSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    isOwner: false,
                  }));

                  // Combina i risultati
                  const allPlans = [...ownedPlans, ...sharedPlans];
                  setAvailablePlans(allPlans);

                  // Imposta il piano attivo se necessario
                  if (!activePlanId && allPlans.length > 0) {
                    setActivePlanId(allPlans[0].id);
                    // Imposta sharedWith solo se è il proprietario
                    if (allPlans[0].isOwner) {
                      setSharedWithUsers(allPlans[0].sharedWith || []);
                    }
                  }
                }
              );

              return () => unsubShared();
            });

            return () => unsubOwned();
          };

          loadPlans();
        } catch (error) {
          console.error("Errore nel caricamento iniziale:", error);
        }
      } else {
        setActivePlanId(null);
        setAvailablePlans([]);
        setSharedWithUsers([]);
        setMeals([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Carica i pasti per il piano attivo
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

  // Funzioni di gestione pasti
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

  // Componente per selezionare il piano attivo
  const PlanSelector = () => {
    if (availablePlans.length <= 1) return null;

    return (
      <div style={{ marginBottom: "20px" }}>
        <select
          value={activePlanId || ""}
          onChange={(e) => setActivePlanId(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            width: "100%",
            maxWidth: "300px",
          }}
        >
          {availablePlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name || "Piano Pasti"}
              {plan.ownerEmail === user.email
                ? "(Tuo)"
                : `(Condiviso da ${plan.ownerEmail})`}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Funzioni di autenticazione da aggiungere dopo le funzioni di gestione pasti
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Inserisci email e password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);

      // Reset form
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error logging in:", error);
      let errorMessage = "Errore di login";

      // Messaggi di errore più specifici
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Email non valida";
          break;
        case "auth/user-disabled":
          errorMessage = "Questo account è stato disabilitato";
          break;
        case "auth/user-not-found":
          errorMessage = "Utente non trovato";
          break;
        case "auth/wrong-password":
          errorMessage = "Password non corretta";
          break;
        case "auth/too-many-requests":
          errorMessage = "Troppi tentativi. Riprova più tardi";
          break;
        default:
          errorMessage = `Errore di login: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Inserisci email e password");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);

      // Crea un piano pasti default per il nuovo utente
      const planRef = await addDoc(collection(db, "mealPlans"), {
        userId: userCredential.user.uid,
        ownerEmail: userCredential.user.email,
        name: "Piano Pasti Personale",
        sharedWith: [], // Array vuoto invece di oggetto
        createdAt: new Date().toISOString(),
      });

      setActivePlanId(planRef.id);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.log("Error signing up:", error);
      // ... gestione errori ...
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Reset di tutti gli stati
      setUser(null);
      setActivePlanId(null);
      setAvailablePlans([]);
      setSharedWithUsers([]);
      setMeals([]);
      setNewMeal({
        date: "",
        lunch: "",
        dinner: "",
        lunchCategory: "altro",
        dinnerCategory: "altro",
      });
      setEditingMeal(null);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Errore durante il logout");
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

  // Rendering principale
  return (
    <div style={containerStyle}>
      {/* {isDev && <DebugSharingView currentUser={user} />} */}

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

      <PlanSelector />

      {activePlanId && (
        <>
          <WeeklyView
            currentWeek={currentWeek}
            navigateWeek={navigateWeek}
            getWeekDates={getWeekDates}
            getMealsForDate={getMealsForDate}
            setEditingMeal={setEditingMeal}
            handleDeleteMeal={handleDeleteMeal}
            handleCopyMeal={handleCopyMeal}
            isSharedPlan={
              availablePlans.find((p) => p.id === activePlanId)?.ownerEmail !==
              user.email
            }
          />

          <MealForm
            editingMeal={editingMeal}
            newMeal={newMeal}
            setNewMeal={setNewMeal}
            setEditingMeal={setEditingMeal}
            handleAddMeal={handleAddMeal}
            handleEditMeal={handleEditMeal}
            planId={activePlanId}
          />

          {availablePlans.find((p) => p.id === activePlanId)?.ownerEmail ===
            user.email && (
            <SharingManager
              planId={activePlanId}
              sharedWithUsers={sharedWithUsers}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
