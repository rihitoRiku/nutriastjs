import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

import ResponseClass from "../utils/response.js";
import { Users } from "../models/user.model.js";

// get all users
const get = async (req, res, next) => {
  try {
    const dbResult = await Users.findAll();
    const responseSuccess = new ResponseClass.SuccessResponse(
      "success",
      200,
      "Fetching users successfully!",
      dbResult
    );
    return res.status(200).json(responseSuccess);
  } catch (error) {
    console.error(`Error while getting users`, error.message);
    next(error);
  }
};

// get user by id
const getById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    try {
      const dbResult = await Users.findOne({
        where: { id: userId },
        attributes: [
          "username",
          "email",
          "gender",
          "birthdate",
          "height",
          "weight",
          "fatneed",
          "proteinneed",
          "caloryneed",
          "fiberneed",
          "carbohidrateneed",
          "smoke",
          "alcho",
          "active",
          "cardiovascular",
        ],
      });
      // Capitalize the first letter of the gender
      const gender =
        dbResult.gender.charAt(0).toUpperCase() + dbResult.gender.slice(1);
      // Calculate age based on birthdate
      const birthdate = new Date(dbResult.birthdate);
      const ageDiffMs = Date.now() - birthdate.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      // Set success response properties
      const responseSuccess = new ResponseClass.SuccessResponse(
        "success",
        200,
        "Fetching user by Id successfully!",
        { ...dbResult.toJSON(), gender, age }
      );
      return res.status(200).json(responseSuccess);
    } catch (err) {
      const responseError = new ResponseClass.ErrorResponse(
        "error",
        400,
        "Fetching user by Id failed!"
      );
      return res.status(400).json(responseError);
    }
  } catch (err) {
    console.error(`Error while getting user by id`, err.message);
    next(err);
  }
};

// register user
const register = async (req, res, next) => {
  try {
    // Check if any required fields are missing or invalid
    if (
      !req.email ||
      !req.password ||
      !req.username ||
      !req.birthdate ||
      !req.gender ||
      !req.height ||
      !req.weight
    ) {
      const responseError = new ResponseClass.ErrorResponse(
        "error",
        400,
        "Please fill all fields correctly!"
      );
      return res.status(400).json(responseError);
    } else {
      // Parse the birthdate from the request body
      const parsedBirthdate = new Date(req.birthdate);
      // Variable initialization
      let age = 0;
      let fatneed = 0.0;
      let proteinneed = 0.0;
      let caloryneed = 0.0;
      let fiberneed = 0.0;
      let carbohidrateneed = 0.0; // Kebutuhan karbohidrat: 65% x kebutuhan kalori
      let bmr = 0.0;
      // Activity factor numbers
      let lightphysical = 1.375; // pekerja kantor yang menggunakan komputer
      let mediumphysical = 1.55; // olahragawan biasa
      let hardphysical = 1.725; // atlet atau orang yang melakukan pekerjaan fisik berat
      // Calculate age
      const birthdate = new Date(req.birthdate);
      const ageDiffMs = Date.now() - birthdate.getTime();
      const ageDate = new Date(ageDiffMs);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
      // Calculate BMR (Basal Metabolic Rate) using Harris-Benedict equation
      if (req.gender == "male") {
        // BMR = 88,362 + (13,397 x berat badan dalam kg) + (4,799 x tinggi badan dalam cm) – (5,677 x usia dalam tahun)
        bmr = 88.362 + 13.397 * req.weight + 4.799 * req.height - 5.677 * age;
      } else if (req.gender == "female") {
        // BMR = 447,593 + (9,247 x berat badan dalam kg) + (3,098 x tinggi badan dalam cm) – (4,330 x usia dalam tahun)
        bmr = 447.593 + 9.247 * req.weight + 3.098 * req.height - 4.33 * age;
      }
      // Total Energy Expenditure = Basal Metabolic Rate * Physical Activity Factor
      caloryneed = bmr * mediumphysical;
      // Total kalori harian x Persentase lemak (20%) / 9
      fatneed = (0.2 * caloryneed) / 9;
      // Kebutuhan protein adalah sebesar 15% dari kebutuhan kalori total. Setelah menemukan besarnya kalori untuk protein, ubahlah ke dalam gram. Protein sebanyak 1 gram setara dengan 4 kalori.
      proteinneed = (0.15 * caloryneed) / 4;
      fiberneed = 30; // dalam gram
      const emailRegexp =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      // Check if email is valid
      if (emailRegexp.test(req.email) == false) {
        const responseError = new ResponseClass.ErrorResponse(
          "error",
          400,
          "Email is invalid!"
        );
        return res.status(400).json(responseError);
      } else {
        // Check if email is already registered
        const emailuserRegistered = await Users.findOne({
          where: { email: req.email },
        });
        if (emailuserRegistered == null) {
          // Generate salt and hash password
          const salt = await bcrypt.genSalt();
          const hashPass = await bcrypt.hash(req.password, salt);
          // Create data object for user registration
          const data = {
            id: uuidv4(),
            name: req.name,
            email: req.email,
            password: hashPass,
            username: req.username,
            birthdate: parsedBirthdate,
            gender: req.gender,
            height: req.height,
            weight: req.weight,
            fatneed: fatneed,
            proteinneed: proteinneed,
            caloryneed: caloryneed,
            fiberneed: fiberneed,
            carbohidrateneed: carbohidrateneed,
          };
          try {
            // Add user to the database
            await Users.create(data);
            // Set success response properties
            const responseSuccess = new ResponseClass.SuccessResponse(
              "success",
              200,
              "Register success!",
              data
            );
            return res.status(200).json(responseSuccess);
          } catch (error) {
            const responseError = new ResponseClass.ErrorResponse(
              "error",
              400,
              "Register failed!"
            );
            return res.status(400).json(responseError);
          }
        } else {
          const responseError = new ResponseClass.ErrorResponse(
            "error",
            400,
            "Email has been registered!"
          );
          return res.status(400).json(responseError);
        }
      }
    }
  } catch (error) {
    console.error(`Error while register user!`, error.message);
    next(error);
  }
};

// EXPORT
export default {
  get,
  getById,
  register,
};
