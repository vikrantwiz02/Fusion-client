import { createSlice } from "@reduxjs/toolkit";

import { displayName } from "../lib/displayName";

const userSlice = createSlice({
  name: "user",
  initialState: {
    username: "User",
    roll_no: "",
    roles: ["Guest-User"],
    role: "Guest-User",
    accessibleModules: {}, // Format---> {role: {module: true}}
    currentAccessibleModules: {}, // Format---> {module: true}
    mustCompleteProfile: false, // first-login student must finish profile popup
    authChecked: false, // /api/auth/me has resolved (gates route rendering)
    programmeType: null, // UG | PG | PHD — decides which academic pages exist
    profilePhoto: "", // student's own photo, shown on the sidebar avatar
  },
  reducers: {
    setProgrammeType: (state, action) => {
      state.programmeType = action.payload;
    },
    setProfilePhoto: (state, action) => {
      state.profilePhoto = action.payload;
    },
    setMustCompleteProfile: (state, action) => {
      state.mustCompleteProfile = action.payload;
    },
    setAuthChecked: (state, action) => {
      state.authChecked = action.payload;
    },
    setUserName: (state, action) => {
      state.username = displayName(action.payload, "User");
    },
    setRollNo: (state, action) => {
      state.roll_no = action.payload;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setAccessibleModules: (state, action) => {
      state.accessibleModules = action.payload;
    },
    setCurrentAccessibleModules: (state) => {
      state.currentAccessibleModules =
        state.accessibleModules[state.role] || {};
    },
    clearUserName: (state) => {
      state.username = "User";
    },
    clearRoles: (state) => {
      state.roles = null;
    },
  },
});

export const {
  setUserName,
  setRollNo,
  setRoles,
  setRole,
  setAccessibleModules,
  setCurrentAccessibleModules,
  setMustCompleteProfile,
  setAuthChecked,
  setProgrammeType,
  setProfilePhoto,
  clearUserName,
  clearRoles,
} = userSlice.actions;
export default userSlice.reducer;
