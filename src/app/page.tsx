import Anonymizer from "@/components/anonymizer";

function Home() {
    return (
        <div className="py-6 flex flex-col items-center space-y-6">
            <h1 className="text-4xl text-center">Anonymize-it</h1>
            <Anonymizer />
        </div>
    );
}

export default Home;
