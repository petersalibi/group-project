import { View } from "react-native";
import { useParams } from "react-router-native";
import LossLandscape2D from "../components/LossLandscape2D";
import LossLandscape3D from "../components/LossLandscape3D";

export function InteractiveLessonPage() {
    const { lessonId } = useParams();
    return (
        <View>
            <LossLandscape2D></LossLandscape2D>
            <LossLandscape3D></LossLandscape3D>
        </View>
    )
}