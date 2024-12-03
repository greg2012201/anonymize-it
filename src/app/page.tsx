import Anonymizer from "@/components/anonymizer";
import AnonymizerClient from "@/components/anonymizer-client";

function Home() {
    return (
        <div className="py-6 flex flex-col items-center space-y-6">
            <h1 className="text-4xl text-center">Anonymize-it</h1>
            {/* <Anonymizer /> */}
            <AnonymizerClient />
        </div>
    );
}

export default Home;
