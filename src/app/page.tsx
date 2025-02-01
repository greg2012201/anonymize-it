import Anonymizer from "@/components/anonymizer";
import AnonymizerClient from "@/components/anonymizer-client";

function Home() {
  return (
    <div className="flex flex-col items-center space-y-6 py-6">
      <h1 className="text-center text-4xl">Anonymize-it</h1>
      <AnonymizerClient />
    </div>
  );
}

export default Home;
