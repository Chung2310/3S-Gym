const express = require('express');
const router = express.Router();

router.post('/calculate', (req, res) => {
    const { gender, weight, height, age, activityLevel, goal } = req.body;

    if (!gender || !weight || !height || !age) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    let bmr = 0;
    if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    };

    const multiplier = activityMultipliers[activityLevel] || 1.2;
    let tdee = bmr * multiplier;

    let targetCalories = tdee;
    if (goal === 'lose') {
        targetCalories -= 500;
    } else if (goal === 'gain') {
        targetCalories += 500;
    }

    const proteinCalories = targetCalories * 0.30;
    const carbCalories = targetCalories * 0.40;
    const fatCalories = targetCalories * 0.30;

    const macros = {
        protein: Math.round(proteinCalories / 4),
        carbs: Math.round(carbCalories / 4),
        fat: Math.round(fatCalories / 9)
    };

    const meals = {
        breakfast: {
            calories: Math.round(targetCalories * 0.25),
            protein: Math.round(macros.protein * 0.25),
            carbs: Math.round(macros.carbs * 0.25),
            fat: Math.round(macros.fat * 0.25)
        },
        lunch: {
            calories: Math.round(targetCalories * 0.35),
            protein: Math.round(macros.protein * 0.35),
            carbs: Math.round(macros.carbs * 0.35),
            fat: Math.round(macros.fat * 0.35)
        },
        snack: {
            calories: Math.round(targetCalories * 0.10),
            protein: Math.round(macros.protein * 0.10),
            carbs: Math.round(macros.carbs * 0.10),
            fat: Math.round(macros.fat * 0.10)
        },
        dinner: {
            calories: Math.round(targetCalories * 0.30),
            protein: Math.round(macros.protein * 0.30),
            carbs: Math.round(macros.carbs * 0.30),
            fat: Math.round(macros.fat * 0.30)
        }
    };

    res.json({
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        macros,
        meals
    });
});

module.exports = router;
