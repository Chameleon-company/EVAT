import { deg2rad, getDistanceFromLatLonInKm } from '../../src/routes/charger';


describe('charger', () => {
    describe('deg2rad', () => {

        test('Case: Converts degrees to radians correctly', () => {
            // Arrange
            const degrees = 180;

            // Act
            const result = deg2rad(degrees);

            // Assert
            expect(result).toBe(Math.PI);
        });
    });

    describe('getDistanceFromLatLonInKm', () => {

        test('Case: Calculates distance between two points accurately', () => {
            // Arrange
            const lat1 = 0, lon1 = 0;
            const lat2 = 0, lon2 = 1;

            // Act
            const result = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);

            // Assert
            expect(result).toBeCloseTo(111.19, 1); // approx. 111 km per degree longitude at equator
        });
    });
});
