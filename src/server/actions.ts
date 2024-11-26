"use server";

export async function uploadFile(formData: FormData) {
    const file = formData.get("file") as File;

    try {
        const response = await fetch("http://127.0.0.1:8000/api/py/analyze", {
            method: "POST",
            body: formData,
        }).then((res) => res.json());

        console.log("response", response);
    } catch (e) {
        console.error("Failed to upload file");
    }
}
