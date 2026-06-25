import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    let settings = await db.systemSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          id: 1,
          tempMin: 26.0,
          tempMax: 30.0,
          phMin: 6.5,
          phMax: 8.5,
          doMin: 5.0,
          aeratorState: true,
          boreholePumpState: false,
          predictiveEnabled: true,
          intervalMinutes: 3,
          wifiSsid: "AquariumGuard_Net",
          wifiPass: "aquarium123",
          serverIp: "192.168.1.100",
          serverPort: 3000,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tempMin,
      tempMax,
      phMin,
      phMax,
      doMin,
      aeratorState,
      boreholePumpState,
      predictiveEnabled,
      intervalMinutes,
      wifiSsid,
      wifiPass,
      serverIp,
      serverPort,
    } = body;

    const updatedSettings = await db.systemSettings.upsert({
      where: { id: 1 },
      update: {
        tempMin: tempMin !== undefined ? Number(tempMin) : undefined,
        tempMax: tempMax !== undefined ? Number(tempMax) : undefined,
        phMin: phMin !== undefined ? Number(phMin) : undefined,
        phMax: phMax !== undefined ? Number(phMax) : undefined,
        doMin: doMin !== undefined ? Number(doMin) : undefined,
        aeratorState: aeratorState !== undefined ? Boolean(aeratorState) : undefined,
        boreholePumpState: boreholePumpState !== undefined ? Boolean(boreholePumpState) : undefined,
        predictiveEnabled: predictiveEnabled !== undefined ? Boolean(predictiveEnabled) : undefined,
        intervalMinutes: intervalMinutes !== undefined ? Math.max(1, Number(intervalMinutes)) : undefined,
        wifiSsid: wifiSsid !== undefined ? String(wifiSsid) : undefined,
        wifiPass: wifiPass !== undefined ? String(wifiPass) : undefined,
        serverIp: serverIp !== undefined ? String(serverIp) : undefined,
        serverPort: serverPort !== undefined ? Number(serverPort) : undefined,
      },
      create: {
        id: 1,
        tempMin: Number(tempMin ?? 26.0),
        tempMax: Number(tempMax ?? 30.0),
        phMin: Number(phMin ?? 6.5),
        phMax: Number(phMax ?? 8.5),
        doMin: Number(doMin ?? 5.0),
        aeratorState: aeratorState !== undefined ? Boolean(aeratorState) : true,
        boreholePumpState: boreholePumpState !== undefined ? Boolean(boreholePumpState) : false,
        predictiveEnabled: predictiveEnabled !== undefined ? Boolean(predictiveEnabled) : true,
        intervalMinutes: Math.max(1, Number(intervalMinutes ?? 3)),
        wifiSsid: String(wifiSsid ?? "AquariumGuard_Net"),
        wifiPass: String(wifiPass ?? "aquarium123"),
        serverIp: String(serverIp ?? "192.168.1.100"),
        serverPort: Number(serverPort ?? 3000),
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export { POST as PUT };
