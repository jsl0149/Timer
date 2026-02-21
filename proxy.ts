import { NextResponse, type NextRequest } from 'next/server';

// 로그인(Auth) 안 쓸 때는 세션 갱신 없이 그냥 통과
export async function proxy(request: NextRequest) {
  return NextResponse.next();
}
