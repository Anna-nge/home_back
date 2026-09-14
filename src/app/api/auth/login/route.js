import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASS;
const DB_NAME = process.env.DB_NAME;

export async function POST(req) {
  try {
    const data = await req.json();

    const { email, password } = data;

    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Missing email or password",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Check admin account
    const admin = checkAdmin(email, password);

    // If not admin, check MongoDB user
    const user = !admin
      ? await checkUser(email, password)
      : admin;

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid email or password",
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // Create JWT
    const token = getJwtToken(user);

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );

    // Create authentication Cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: false,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// Handle CORS preflight request
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function checkAdmin(email, password) {
  if (!adminUser || !adminPass) {
    return false;
  }

  if (adminUser === email && adminPass === password) {
    return {
      _id: "-1",
      email: email,
      username: "admin",
    };
  }

  return false;
}

async function checkUser(email, password) {
  try {
    const client = await getClientPromise();

    const db = client.db(DB_NAME);

    const user = await db
      .collection("user")
      .findOne({ email });

    if (!user) {
      return false;
    }

    const check = await bcrypt.compare(
      password,
      user.password
    );

    if (!check) {
      return false;
    }

    return user;
  } catch (error) {
    console.error("Database login error:", error);
    return false;
  }
}

function getJwtToken(user) {
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return token;
}