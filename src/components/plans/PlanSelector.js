import React from "react";

const PlanSelector = ({
  activePlanId,
  availablePlans,
  user,
  setActivePlanId,
}) => {
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
              ? " (Tuo)"
              : ` (Condiviso da ${plan.ownerEmail})`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PlanSelector;
