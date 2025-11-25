import EnhancedRangePage from '@/components/EnhancedRangePage'

export default function DynamicDrivingRangePage() {
  return (
    <EnhancedRangePage
      slug="dynamic-driving-range"
      cityName="Milton Keynes"
      cityPath="/uk/milton-keynes"
      cityCenterCoords={[52.0406, -0.7594]}
    />
  )
}