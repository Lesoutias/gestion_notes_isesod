import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  title: 'Gestion des Notes',
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {},
})

export default appSlice.reducer
