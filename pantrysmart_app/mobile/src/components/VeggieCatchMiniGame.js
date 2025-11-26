// pantrysmart_app/mobile/src/components/VeggieCatchMiniGame.js

import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const VEGGIE_ICONS = ["carrot", "corn", "food-apple", "mushroom", "leaf"];

const GRAVITY = 0.7;
const JUMP_VELOCITY = 10;
const GAME_TICK_MS = 30;
const OBSTACLE_INTERVAL_MS = 1300;
const GROUND_HEIGHT = 24;
const ROBOT_SIZE = 32;
const OBSTACLE_SIZE = 22;

export default function VeggieCatchMiniGame() {
  const [gameWidth, setGameWidth] = useState(260);
  const [playerY, setPlayerY] = useState(0); // píxeles sobre el suelo
  const playerYRef = useRef(0);
  const velocityRef = useRef(0);

  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const loopRef = useRef(null);
  const spawnRef = useRef(null);

  // Mantener referencia al Y del jugador para cálculos en el loop
  useEffect(() => {
    playerYRef.current = playerY;
  }, [playerY]);

  // Loop de juego: física + movimiento + colisiones
  useEffect(() => {
    if (!gameWidth || gameOver) return;

    loopRef.current = setInterval(() => {
      // Actualizar salto
      setPlayerY((prevY) => {
        let newY = prevY + velocityRef.current;
        velocityRef.current -= GRAVITY;

        if (newY <= 0) {
          newY = 0;
          velocityRef.current = 0;
        }
        return newY;
      });

      // Mover obstáculos y comprobar colisiones / puntos
      setObstacles((prev) => {
        if (!prev.length) return prev;

        const updated = [];
        prev.forEach((obs) => {
          const newX = obs.x - obs.speed;

          // Si ya salió de pantalla, lo descartamos
          if (newX + OBSTACLE_SIZE < 0) return;

          const robotX = gameWidth * 0.2; // robot a ~20% del ancho
          const robotLeft = robotX - ROBOT_SIZE / 2;
          const robotRight = robotX + ROBOT_SIZE / 2;
          const obsLeft = newX;
          const obsRight = newX + OBSTACLE_SIZE;

          const horizontalOverlap =
            obsLeft < robotRight && obsRight > robotLeft;
          const robotIsLow = playerYRef.current < 18; // casi en el suelo

          // Si el obstáculo ya pasó completamente al robot → sumar puntos
          let passed = obs.passed;
          if (!passed && obsRight < robotLeft) {
            passed = true;
            setScore((s) => s + 100);
          }

          // Colisión
          if (horizontalOverlap && robotIsLow) {
            setGameOver(true);
          }

          updated.push({ ...obs, x: newX, passed });
        });

        return updated;
      });
    }, GAME_TICK_MS);

    return () => {
      clearInterval(loopRef.current);
    };
  }, [gameWidth, gameOver]);

  // Spawner de verduras
  useEffect(() => {
    if (!gameWidth || gameOver || !hasStarted) return;

    spawnRef.current = setInterval(() => {
      setObstacles((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: gameWidth + 10,
          speed: 4 + Math.random() * 2,
          icon:
            VEGGIE_ICONS[Math.floor(Math.random() * VEGGIE_ICONS.length)],
          passed: false,
        },
      ]);
    }, OBSTACLE_INTERVAL_MS);

    return () => {
      clearInterval(spawnRef.current);
    };
  }, [gameWidth, gameOver, hasStarted]);

  const handleJumpOrRestart = () => {
    // Si perdió → reiniciar mini-juego
    if (gameOver) {
      setGameOver(false);
      setScore(0);
      setObstacles([]);
      setPlayerY(0);
      playerYRef.current = 0;
      velocityRef.current = 0;
      setHasStarted(false);
      return;
    }

    // Primer tap → empieza a spawnear obstáculos
    if (!hasStarted) {
      setHasStarted(true);
    }

    // Solo saltar si está en el suelo
    if (playerYRef.current === 0) {
      velocityRef.current = JUMP_VELOCITY;
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameTitle}>Mini-juego: salta las verduras</Text>
        <Text style={styles.scoreText}>🏆 {score}</Text>
      </View>

      <Pressable
        style={styles.gameArea}
        onPress={handleJumpOrRestart}
        onLayout={(e) => setGameWidth(e.nativeEvent.layout.width)}
      >
        {/* Suelo */}
        <View style={styles.ground} />

        {/* Robot corriendo */}
        <View
          style={[
            styles.robotContainer,
            {
              left: gameWidth ? gameWidth * 0.2 - ROBOT_SIZE / 2 : 40,
              bottom: GROUND_HEIGHT + playerY,
            },
          ]}
        >
          <View style={styles.robotBubble}>
            <MaterialCommunityIcons name="robot" size={22} color="#fff" />
          </View>
        </View>

        {/* Verduras (obstáculos) */}
        {obstacles.map((obs) => (
          <View
            key={obs.id}
            style={[
              styles.obstacle,
              { left: obs.x, bottom: GROUND_HEIGHT + 2 },
            ]}
          >
            <MaterialCommunityIcons name={obs.icon} size={20} color="#16a34a" />
          </View>
        ))}

        {/* Mensajes centrales */}
        <View style={styles.centerTextContainer}>
          {gameOver ? (
            <>
              <Text style={styles.gameOverText}>
                ¡Ups! Una verdura te atrapó 🍅
              </Text>
              <Text style={styles.gameOverSubtext}>
                Toca para reiniciar el mini-juego
              </Text>
            </>
          ) : (
            <>
              {/* <Text style={styles.hintText}>
                Toca la pantalla para que el robot salte
              </Text>
              <Text style={styles.hintSubtext}>
                +100 puntos por cada verdura que esquives
              </Text> */}
            </>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    backgroundColor: "#ecfdf5",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#047857",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
  },
  gameArea: {
    width: "100%",
    height: 180,
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    overflow: "hidden",
  },
  ground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: GROUND_HEIGHT,
    height: 6,
    backgroundColor: "#4ade80",
  },
  robotContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  robotBubble: {
    width: ROBOT_SIZE,
    height: ROBOT_SIZE,
    borderRadius: ROBOT_SIZE / 2,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },
  obstacle: {
    position: "absolute",
  },
  centerTextContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 12,
    alignItems: "center",
  },
  hintText: {
    fontSize: 12,
    color: "#065f46",
    fontWeight: "600",
  },
  hintSubtext: {
    fontSize: 11,
    color: "#047857",
    marginTop: 2,
  },
  gameOverText: {
    fontSize: 13,
    color: "#b91c1c",
    fontWeight: "700",
    textAlign: "center",
  },
  gameOverSubtext: {
    fontSize: 11,
    color: "#7f1d1d",
    marginTop: 2,
    textAlign: "center",
  },
});
