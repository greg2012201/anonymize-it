// should be just functions to be able to explicitly run it

function withPromise(
  onResolve: (resolve: (value: unknown) => void) => void,
  onReject: (reject: (reason?: any) => void) => void,
) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("timeout"));
    }, 500000);
    onResolve(resolve);
    onReject(reject);
  });
}

function interceptMissingWorker(worker: Worker | null) {
  if (worker === null) {
    return Promise.reject("worker is null");
  }
  return (eventFn: (worker: Worker) => Promise<any>) => eventFn(worker);
}

export function loadModels(worker: Worker | null) {
  if (worker === null) {
    return Promise.reject("worker is null");
  }
  worker.postMessage({ type: "LOAD_MODELS" });

  return withPromise(
    (resolve) => {
      worker.onmessage = (event) => {
        const { type } = event.data;
        if (type === "MODELS_LOADED") {
          resolve("done");
        }
      };
    },
    () => {
      console.error("error loading models");
    },
  );
}

export function detectExampleFace(
  worker: Worker | null,
  { message, transfelable }: { message: any; transfelable: any[] },
) {
  // TODO: type payload and place type in the shared types file
  if (worker === null) {
    return Promise.reject("worker is null");
  }
  worker.postMessage({ ...message, type: "DETECT_EXAMPLE_FACE" }, transfelable);

  return withPromise(
    (resolve) => {
      worker.onmessage = (event) => {
        const { type } = event.data;
        if (type === "EXAMPLE_FACE_DETECTED") {
          resolve(event.data);
        }
      };
    },
    () => {
      console.error("error detecting example face");
    },
  );
}
