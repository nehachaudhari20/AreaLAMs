import { SignIn } from "@clerk/nextjs";
// import loginImg from "@/app/img/loginImg.avif";
// import Image from "next/image";
export default function Page() {
  return (
    <>
      {/*
  Heads up! 👋

  Plugins:
    - @tailwindcss/forms
*/}

      <section>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <SignIn />
        </div>
      </section>
    </>
  );
}
