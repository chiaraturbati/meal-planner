import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export const useMealPlans = (user) => {
  const [activePlanId, setActivePlanId] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [sharedWithUsers, setSharedWithUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      setActivePlanId(null);
      setAvailablePlans([]);
      setSharedWithUsers([]);
      return;
    }

    const plansRef = collection(db, "mealPlans");
    const ownedPlansQuery = query(plansRef, where("userId", "==", user.uid));
    const sharedPlansQuery = query(
      plansRef,
      where("sharedWith", "array-contains", user.email)
    );

    const unsubOwned = onSnapshot(ownedPlansQuery, (snapshot) => {
      const ownedPlans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOwner: true,
      }));

      const unsubShared = onSnapshot(sharedPlansQuery, (sharedSnapshot) => {
        const sharedPlans = sharedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isOwner: false,
        }));

        const allPlans = [...ownedPlans, ...sharedPlans];
        setAvailablePlans(allPlans);

        if (!activePlanId && allPlans.length > 0) {
          setActivePlanId(allPlans[0].id);
          if (allPlans[0].isOwner) {
            setSharedWithUsers(allPlans[0].sharedWith || []);
          }
        }
      });

      return () => unsubShared();
    });

    return () => unsubOwned();
  }, [user]);

  return {
    activePlanId,
    setActivePlanId,
    availablePlans,
    sharedWithUsers,
    setSharedWithUsers,
  };
};
