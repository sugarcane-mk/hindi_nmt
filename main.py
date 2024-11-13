from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import subprocess
import json
import os
import shutil 

app = FastAPI()

# Add CORS middleware to allow requests from specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use your specific origin here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/translate-audio")
async def run_model(audio_file: UploadFile = File(...)):
    # Save the uploaded audio file
    audio_path = os.path.join("/home/sltlab/kaldi/egs/IIT-DH-CNN_Testing/", audio_file.filename)
    print("Saving audio to:", audio_path)  # Debugging statement
    with open(audio_path, "wb") as saved_file:
        shutil.copyfileobj(audio_file.file, saved_file)
    print("Audio file saved.")  # Debugging statement

    # Run final_run.sh script with audio_path as an argument
    result = subprocess.run(
        ["/home/sltlab/kaldi/egs/IIT-DH-CNN_Testing/app_run.sh", audio_path],
        capture_output=True, text=True
    )
    print("Execution completed for app_run.sh is a success.")
    print("stdout:", result.stdout)  # Debugging statement
    # print("stderr:", result.stderr)  # Debugging statement
    
    # Check if the script executed successfully
    if result.returncode != 0:
        return JSONResponse(content={"error": "Script execution failed"}, status_code=500)

    # Load JSON output data from output.json
    output_json_path = "/home/sltlab/kaldi/egs/IIT-DH-CNN_Testing/output.json"
    if not os.path.exists(output_json_path):
        return JSONResponse(content={"error": "Output file not found"}, status_code=500)

    with open(output_json_path, "r") as json_file:
        output_data = json.load(json_file)

    # Return the JSON data (including text and file paths) to the frontend
    print("Loaded JSON:", output_data)  # Debugging statement
    return output_data

@app.get("/download_audio")
async def download_audio(filename: str):
    audio_path = os.path.join("/home/sltlab/kaldi/egs/IIT-DH-CNN_Testing", filename)
    if os.path.exists(audio_path):
        return FileResponse(audio_path, media_type="audio/wav", filename=filename)
    return JSONResponse(content={"error": "File not found"}, status_code=404)

