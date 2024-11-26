import { Input } from "./ui/input";
import { uploadFile } from "@/server/actions";
import { Button } from "./ui/button";

function Anonymizer() {
    return (
        <form action={uploadFile} className="grid w-full max-w-sm items-center gap-1.5">
            <Input id="file" name="file" type="file" />
            <Button type="submit">Send</Button>
        </form>
    );
}

export default Anonymizer;
