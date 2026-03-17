#!/bin/bash
cd backend
env USE_SQLITE=True .venv/bin/python manage.py runserver &
cd ../frontend
npm run dev
