import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  PlanSelector,
  MealForm,
  WeeklyView,
  SharingManager,
  UserHeader,
  LoginForm,
} from "./components";
import { containerStyle } from "./utils/styles";
import { useMealPlans, useMeals } from "./hooks";

function App() {
  // Stati di autenticazione
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Stato per la navigazione settimanale
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() - now.getDay() + 1);
    return now.toISOString().split("T")[0];
  });

  // Effetto per il monitoraggio dello stato di autenticazione
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Custom hooks per la gestione dei piani pasto e dei pasti
  const { activePlanId, setActivePlanId, availablePlans, sharedWithUsers } =
    useMealPlans(user);

  const {
    newMeal,
    setNewMeal,
    editingMeal,
    setEditingMeal,
    handleAddMeal,
    handleEditMeal,
    handleDeleteMeal,
    handleCopyMeal,
    getMealsForDate,
  } = useMeals(activePlanId, user);

  // Funzioni di utility per la gestione delle date
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

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeek(newDate.toISOString().split("T")[0]);
  };

  // Rendering condizionale per utenti non autenticati
  if (!user) {
    return (
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
      />
    );
  }

  // Verifica se il piano corrente è condiviso
  const isCurrentPlanShared =
    activePlanId &&
    availablePlans.find((p) => p.id === activePlanId)?.ownerEmail !==
      user.email;

  // Rendering principale per utenti autenticati
  return (
    <div style={containerStyle}>
      <UserHeader user={user} />

      <PlanSelector
        activePlanId={activePlanId}
        availablePlans={availablePlans}
        user={user}
        setActivePlanId={setActivePlanId}
      />

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
            isSharedPlan={isCurrentPlanShared}
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

          {!isCurrentPlanShared && (
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
