# Workout Timer App

A static workout timer web application built with React + TypeScript.

## Overview

Single-page workout timer with:
- **3-minute interval countdown** that loops automatically
- **45-minute total session countdown**
- Voice announcements via Web Speech API
- Buzzer sound via Web Audio API
- Dark workout aesthetic

## Architecture

- **Frontend only** — no backend data persistence needed
- `client/src/pages/workout-timer.tsx` — main timer component
- `client/src/App.tsx` — routing (single route to WorkoutTimer)

## Features

- Interval timer: 3:00 countdown, resets and loops when it hits 0
- Session timer: 45:00 total countdown
- Start / Pause / Stop controls
- Voice announcements: "Two minutes to go", "One minute to go", and countdown "5, 4, 3, 2, 1"
- Buzzer sound (sawtooth oscillator via WebAudio) at end of each interval
- Color-coded urgency: timer turns amber at ≤10s, red at ≤5s
- Progress bars for both interval and session
- Round counter
- "Workout Complete!" banner when session ends

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- wouter for routing
- No database — purely client-side state
