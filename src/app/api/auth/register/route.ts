import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const session = await db.registerUser({
      fullName: validated.fullName,
      email: validated.email,
      password: validated.password,
      phone: validated.phone,
      role: validated.role,
      department: validated.department,
      specialization: validated.specialization,
      licenseNumber: validated.licenseNumber,
      consultationFee: validated.consultationFee,
      roomNumber: validated.roomNumber,
      qualifications: validated.qualifications,
      age: validated.age,
      gender: validated.gender,
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register user" },
      { status: 400 }
    );
  }
}
